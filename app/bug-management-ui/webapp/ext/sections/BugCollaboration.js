sap.ui.define([
    // Gợi ý học/debug: đây là logic section collaboration sau khi Bug đã lưu; trace action về OData trước khi nghi ngờ UI state.
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/util/File"
], function (MessageBox, MessageToast, JSONModel, FileUtil) {
    "use strict";

    var MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
    var ALLOWED_MIME_TYPES = {
        "text/plain": true,
        "application/pdf": true,
        "image/png": true,
        "image/jpeg": true
    };
    var pendingCreateAttachmentsByBugId = Object.create(null);
    var pendingCreateAttachmentUploadByBugId = Object.create(null);

    function normalizeServiceUrl(model) {
        if (model && typeof model.getServiceUrl === "function") {
            return model.getServiceUrl().replace(/\/$/, "");
        }
        return "/odata/v4/bug";
    }

    function createUuid() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
            var random = Math.random() * 16 | 0;
            var value = char === "x" ? random : (random & 0x3 | 0x8);
            return value.toString(16);
        });
    }

    function showSafeError(message) {
        MessageBox.error(message || "The action could not be completed right now. Please refresh and try again.");
    }

    function isBugContext(context) {
        return !!context && typeof context.getPath === "function" && /^\/Bugs\([^/]+\)$/.test(context.getPath());
    }

    function isCreateDraftContext(context) {
        return !!context &&
            context.getProperty("IsActiveEntity") !== true &&
            context.getProperty("HasActiveEntity") !== true;
    }

    function isSavedActiveContext(context) {
        return !!context &&
            context.getProperty("IsActiveEntity") === true &&
            context.getProperty("HasDraftEntity") !== true;
    }

    function bugIdFromContext(context) {
        return context && context.getProperty ? context.getProperty("ID") : null;
    }

    function findBugContext(control) {
        var current = control;
        while (current) {
            if (typeof current.getBindingContext === "function") {
                var context = current.getBindingContext();
                if (isBugContext(context)) {
                    return context;
                }
            }
            current = typeof current.getParent === "function" ? current.getParent() : null;
        }
        return null;
    }

    function findControlRecursive(control, localId) {
        if (!control || typeof control.getId !== "function") {
            return null;
        }
        if (control.getId().split("--").pop() === localId) {
            return control;
        }

        var aggregations = control.getMetadata && control.getMetadata().getAllAggregations
            ? control.getMetadata().getAllAggregations()
            : {};
        return Object.keys(aggregations).reduce(function (found, aggregationName) {
            if (found || typeof control.getAggregation !== "function") {
                return found;
            }
            var aggregation = control.getAggregation(aggregationName);
            if (Array.isArray(aggregation)) {
                return aggregation.reduce(function (innerFound, child) {
                    return innerFound || findControlRecursive(child, localId);
                }, null);
            }
            return found || findControlRecursive(aggregation, localId);
        }, null);
    }

    function findControlByLocalId(control, localId) {
        var current = control;
        while (current) {
            var found = findControlRecursive(current, localId);
            if (found) {
                return found;
            }
            current = typeof current.getParent === "function" ? current.getParent() : null;
        }
        return null;
    }

    function refreshBugContext(context) {
        if (context && typeof context.requestRefresh === "function") {
            return context.requestRefresh();
        }
        return window.Promise.resolve();
    }

    function assertSavedBug(context) {
        if (!context) {
            showSafeError("The bug data is not available yet. Please refresh the page.");
            return false;
        }
        if (context.getProperty("IsActiveEntity") !== true) {
            showSafeError("Please save the bug before adding comments or evidence.");
            return false;
        }
        if (context.getProperty("HasDraftEntity") === true) {
            showSafeError("Please save or discard the current draft before changing comments or evidence.");
            return false;
        }
        return true;
    }

    function request(method, url, options) {
        return new window.Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var headers = options && options.headers ? options.headers : {};
            var body = options && options.body;

            xhr.open(method, url, true);
            if (options && options.responseType) {
                xhr.responseType = options.responseType;
            }
            Object.keys(headers).forEach(function (key) {
                xhr.setRequestHeader(key, headers[key]);
            });
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                    return;
                }
                reject(new Error("Request failed"));
            };
            xhr.onerror = function () {
                reject(new Error("Request failed"));
            };
            xhr.send(body);
        });
    }

    function requestJson(url, options) {
        var headers = Object.assign({
            Accept: "application/json"
        }, options && options.headers ? options.headers : {});
        var body;

        if (options && options.body !== undefined) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(options.body);
        }

        return request(options && options.method ? options.method : "GET", url, {
            headers: headers,
            body: body
        }).then(function (xhr) {
            return xhr.responseText ? JSON.parse(xhr.responseText) : null;
        });
    }

    function requestBinary(url, options) {
        return request(options && options.method ? options.method : "GET", url, {
            headers: options && options.headers ? options.headers : {},
            body: options && options.body,
            responseType: options && options.responseType
        });
    }

    function fileNameFromHeader(xhr, fallback) {
        var header = xhr.getResponseHeader("content-disposition") || "";
        var match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
        return match ? decodeURIComponent(match[1]) : fallback;
    }

    function splitFileName(fileName) {
        var lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
            return {
                base: fileName,
                extension: ""
            };
        }
        return {
            base: fileName.slice(0, lastDotIndex),
            extension: fileName.slice(lastDotIndex + 1)
        };
    }

    function draftPathFromResult(result, fallbackId) {
        var id = result && result.ID ? result.ID : fallbackId;
        return "/Bugs(ID=" + id + ",IsActiveEntity=false)";
    }

    function editDraft(serviceUrl, bugContext) {
        return requestJson(serviceUrl + bugContext.getPath() + "/BugService.draftEdit", {
            method: "POST",
            body: { PreserveChanges: true }
        }).then(function (result) {
            return draftPathFromResult(result, bugContext.getProperty("ID"));
        });
    }

    function activateDraft(serviceUrl, draftPath) {
        return requestJson(serviceUrl + draftPath + "/BugService.draftActivate", {
            method: "POST",
            body: {}
        });
    }

    function validateAttachment(file) {
        if (!file) {
            showSafeError("Please choose a file to upload.");
            return false;
        }
        if (file.size <= 0) {
            showSafeError("The selected file is empty. Please choose another file.");
            return false;
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
            showSafeError("The selected file is too large. Please upload a file up to 10 MB.");
            return false;
        }
        if (file.type && !ALLOWED_MIME_TYPES[file.type]) {
            showSafeError("This file type is not supported. Please upload a text, PDF, PNG, or JPEG file.");
            return false;
        }
        return true;
    }

    function toFileArray(files) {
        return Array.prototype.slice.call(files || []);
    }

    function validateAttachments(files) {
        if (!files.length) {
            showSafeError("Please choose a file to upload.");
            return false;
        }
        return files.every(validateAttachment);
    }

    function pendingFileRows(files) {
        return files.map(function (file) {
            return {
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size
            };
        });
    }

    function setPendingAttachmentListModel(control, bugId) {
        var list = findControlByLocalId(control, "idtsPendingAttachmentsList");
        if (!list) {
            return;
        }
        var files = bugId && pendingCreateAttachmentsByBugId[bugId]
            ? pendingCreateAttachmentsByBugId[bugId]
            : [];
        list.setModel(new JSONModel({
            files: pendingFileRows(files)
        }), "idtsPendingAttachments");
    }

    function queuePendingCreateAttachments(source, bugContext, files) {
        var bugId = bugIdFromContext(bugContext);
        if (!bugId) {
            showSafeError("The selected file could not be attached to this draft. Please refresh and try again.");
            return;
        }

        pendingCreateAttachmentsByBugId[bugId] = (pendingCreateAttachmentsByBugId[bugId] || []).concat(files);
        setPendingAttachmentListModel(source, bugId);
        MessageToast.show(files.length === 1 ? "Evidence selected." : files.length + " evidence files selected.");
    }

    function uploadFilesToSavedBug(source, bugContext, files) {
        var serviceUrl = normalizeServiceUrl(source.getModel());

        return editDraft(serviceUrl, bugContext)
            .then(function (draftPath) {
                return files.reduce(function (chain, file) {
                    return chain.then(function () {
                        var attachmentId = createUuid();
                        var contentType = file.type || "application/octet-stream";

                        return requestJson(serviceUrl + draftPath + "/attachments", {
                            method: "POST",
                            body: {
                                ID: attachmentId,
                                filename: file.name,
                                mimeType: contentType,
                                fileSize: file.size
                            }
                        }).then(function () {
                            return requestBinary(serviceUrl + "/Bugs_attachments(ID=" + attachmentId + ",IsActiveEntity=false)/content", {
                                method: "PUT",
                                headers: {
                                    "Content-Type": contentType,
                                    "Content-Disposition": "attachment; filename=\"" + encodeURIComponent(file.name) + "\""
                                },
                                body: file
                            });
                        });
                    });
                }, window.Promise.resolve()).then(function () {
                    return activateDraft(serviceUrl, draftPath);
                });
            });
    }

    return {
        onAddComment: function (event) {
            var source = event.getSource();
            var bugContext = findBugContext(source);
            if (!assertSavedBug(bugContext)) {
                return;
            }

            var textArea = findControlByLocalId(source, "idtsCommentTextArea");
            var content = textArea && typeof textArea.getValue === "function" ? textArea.getValue().trim() : "";
            if (!content) {
                if (textArea) {
                    textArea.setValueState("Error");
                    textArea.setValueStateText("Enter a comment before posting.");
                }
                return;
            }

            if (textArea) {
                textArea.setValueState("None");
            }

            requestJson(normalizeServiceUrl(source.getModel()) + bugContext.getPath() + "/BugService.addComment", {
                method: "POST",
                body: { content: content }
            }).then(function () {
                if (textArea) {
                    textArea.setValue("");
                }
                return refreshBugContext(bugContext);
            }).then(function () {
                MessageToast.show("Comment posted.");
            }).catch(function () {
                showSafeError("The comment could not be posted. Please refresh and try again.");
            });
        },

        onAttachmentSelected: function (event) {
            var source = event.getSource();
            var bugContext = findBugContext(source);
            var files = toFileArray(event.getParameter("files"));

            if (!validateAttachments(files)) {
                source.clear();
                return;
            }

            if (isCreateDraftContext(bugContext)) {
                queuePendingCreateAttachments(source, bugContext, files);
                source.clear();
                return;
            }

            if (!assertSavedBug(bugContext)) {
                source.clear();
                return;
            }

            source.setEnabled(false);
            uploadFilesToSavedBug(source, bugContext, files)
                .then(function () {
                    source.clear();
                    return refreshBugContext(bugContext);
                })
                .then(function () {
                    MessageToast.show(files.length === 1 ? "Evidence uploaded." : files.length + " evidence files uploaded.");
                })
                .catch(function () {
                    showSafeError("The file could not be uploaded. Please refresh and try again.");
                })
                .finally(function () {
                    source.setEnabled(true);
                });
        },

        onDownloadAttachment: function (event) {
            var source = event.getSource();
            var context = source.getBindingContext();
            var attachmentId = context && context.getProperty("ID");
            var fallbackName = context && context.getProperty("filename") || "attachment";
            if (!attachmentId) {
                showSafeError("The selected file is not available.");
                return;
            }

            requestBinary(normalizeServiceUrl(source.getModel()) + "/Bugs_attachments(ID=" + attachmentId + ",IsActiveEntity=true)/content", {
                method: "GET",
                responseType: "blob"
            }).then(function (xhr) {
                var fileName = fileNameFromHeader(xhr, fallbackName);
                var fileParts = splitFileName(fileName);
                var contentType = xhr.getResponseHeader("content-type") || "application/octet-stream";
                FileUtil.save(xhr.response, fileParts.base, fileParts.extension, contentType);
            }).catch(function () {
                showSafeError("The file could not be downloaded. Please refresh and try again.");
            });
        },

        onDeleteAttachment: function (event) {
            var source = event.getSource();
            var attachmentContext = source.getBindingContext();
            var bugContext = findBugContext(source);
            var attachmentId = attachmentContext && attachmentContext.getProperty("ID");
            var filename = attachmentContext && attachmentContext.getProperty("filename") || "this file";

            if (!attachmentId || !assertSavedBug(bugContext)) {
                return;
            }

            MessageBox.confirm("Remove " + filename + " from this bug?", {
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (action) {
                    if (action !== MessageBox.Action.DELETE) {
                        return;
                    }

                    var serviceUrl = normalizeServiceUrl(source.getModel());
                    source.setEnabled(false);
                    editDraft(serviceUrl, bugContext)
                        .then(function (draftPath) {
                            return requestJson(serviceUrl + "/Bugs_attachments(ID=" + attachmentId + ",IsActiveEntity=false)", {
                                method: "DELETE",
                                headers: {
                                    "If-Match": "*"
                                }
                            }).then(function () {
                                return activateDraft(serviceUrl, draftPath);
                            });
                        })
                        .then(function () {
                            return refreshBugContext(bugContext);
                        })
                        .then(function () {
                            MessageToast.show("Evidence removed.");
                        })
                        .catch(function () {
                            showSafeError("The file could not be removed. Please refresh and try again.");
                        })
                        .finally(function () {
                            source.setEnabled(true);
                        });
                }
            });
        },

        formatDateTime: function (value) {
            if (!value) {
                return "";
            }
            try {
                return new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short"
                }).format(new Date(value));
            } catch (error) {
                void error;
                return value;
            }
        },

        formatFileSize: function (value) {
            var size = Number(value || 0);
            if (size < 1024) {
                return size + " B";
            }
            if (size < 1024 * 1024) {
                return Math.round(size / 102.4) / 10 + " KB";
            }
            return Math.round(size / 104857.6) / 10 + " MB";
        },

        formatAuthorInfo: function (name, role) {
            return role || name || "";
        },

        formatUploader: function (value) {
            return value || "Current user";
        },

        isCreateDraftContext: isCreateDraftContext,

        flushPendingCreateAttachments: function (source, bugContext) {
            var bugId = bugIdFromContext(bugContext);
            var files = bugId && pendingCreateAttachmentsByBugId[bugId]
                ? pendingCreateAttachmentsByBugId[bugId]
                : [];

            setPendingAttachmentListModel(source, bugId);

            if (!bugId || !files.length || !isSavedActiveContext(bugContext) || pendingCreateAttachmentUploadByBugId[bugId]) {
                return;
            }

            pendingCreateAttachmentUploadByBugId[bugId] = true;
            uploadFilesToSavedBug(source, bugContext, files)
                .then(function () {
                    delete pendingCreateAttachmentsByBugId[bugId];
                    setPendingAttachmentListModel(source, bugId);
                    return refreshBugContext(bugContext);
                })
                .then(function () {
                    MessageToast.show(files.length === 1 ? "Evidence uploaded." : files.length + " evidence files uploaded.");
                })
                .catch(function () {
                    delete pendingCreateAttachmentsByBugId[bugId];
                    setPendingAttachmentListModel(source, bugId);
                    showSafeError("The bug was saved, but the selected evidence could not be uploaded. Please upload it again from the saved bug.");
                })
                .finally(function () {
                    delete pendingCreateAttachmentUploadByBugId[bugId];
                });
        }
    };
});
