/**
 * Gợi ý học/debug: profile shell chỉ hiển thị safe profile và gọi logout; backend vẫn kiểm tra role trên mọi OData request.
 * IDTS profile shell for the authenticated Fiori app.
 *
 * Renders a lightweight SAPUI5 profile button into the stable host owned by
 * index.html. It does not inspect or modify generated Fiori Elements controls.
 */
sap.ui.define([
    "sap/m/Button",
    "sap/m/ResponsivePopover",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Avatar",
    "sap/m/Title",
    "sap/m/Text",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/ObjectStatus"
], function (
    Button,
    ResponsivePopover,
    VBox,
    HBox,
    Avatar,
    Title,
    Text,
    Toolbar,
    ToolbarSpacer,
    ObjectStatus
) {
    "use strict";

    var PROFILE_HOST_ID = "idtsProfileShellHost";
    var EXPIRES_KEY = "idts_auth_expires";
    var ButtonType = {
        Transparent: "Transparent",
        Emphasized: "Emphasized"
    };
    var PlacementType = {
        Bottom: "Bottom"
    };

    function init() {
        // Component.init gọi một lần. Thiếu host/user hoặc đã render thì không tạo nút trùng.
        var host = document.getElementById(PROFILE_HOST_ID);
        var user = currentUser();

        if (!host || !user || host.dataset.idtsProfileShellRendered === "true") {
            return;
        }

        host.dataset.idtsProfileShellRendered = "true";
        render(host, user);
    }

    function render(host, user) {
        // Đặt SAPUI5 Button vào div ổn định của index.html, không sửa DOM nội bộ Fiori Elements.
        createProfileButton(user).placeAt(host);
    }

    function createProfileButton(user) {
        // Chuyển safe user thành Button + Popover. Sign Out gọi window.idtsLogout từ auth-guard.js.
        // Breakpoint ở đây khi tên/role/avatar sai hoặc menu không mở.
        var displayName = safeUserText(user.displayName || user.email || "IDTS User");
        var email = safeUserText(user.email || "No email stored");
        var role = safeUserText(user.roleName || user.role_code || "Role not available");
        var expires = safeUserText(formatExpiry(sessionStorage.getItem(EXPIRES_KEY)));

        var profilePopover = new ResponsivePopover({
            placement: PlacementType.Bottom,
            showHeader: false,
            content: [
                new VBox({
                    items: [
                        new HBox({
                            alignItems: "Center",
                            items: [
                                new Avatar({
                                    initials: initialsFrom(displayName),
                                    displayShape: "Circle",
                                    displaySize: "M",
                                    backgroundColor: "Accent6"
                                }),
                                new VBox({
                                    items: [
                                        new Title({ text: displayName, level: "H2", titleStyle: "H5" }),
                                        new Text({ text: email }).addStyleClass("idtsProfileEmail"),
                                        new ObjectStatus({ text: role, state: "Information" }),
                                        new Text({ text: expires }).addStyleClass("idtsProfileExpiry sapUiTinyText")
                                    ]
                                }).addStyleClass("idtsProfileMeta")
                            ]
                        }).addStyleClass("idtsProfileHeader"),
                        new Toolbar({
                            content: [
                                new ToolbarSpacer(),
                                new Button({
                                    text: "Sign Out",
                                    icon: "sap-icon://log",
                                    type: ButtonType.Emphasized,
                                    press: function () {
                                        profilePopover.close();
                                        if (typeof window.idtsLogout === "function") {
                                            window.idtsLogout();
                                        }
                                    }
                                })
                            ]
                        })
                    ]
                }).addStyleClass("idtsProfilePopoverContent")
            ]
        });

        return new Button({
            icon: "sap-icon://person-placeholder",
            type: ButtonType.Transparent,
            tooltip: "Open profile menu for " + displayName,
            press: function (event) {
                profilePopover.openBy(event.getSource());
            }
        }).addStyleClass("idtsProfileButton");
    }

    function currentUser() {
        // Dependency ngược về auth-guard: chỉ lấy profile đã parse an toàn.
        if (typeof window.idtsCurrentUser === "function") {
            return window.idtsCurrentUser();
        }
        return null;
    }

    function safeUserText(value) {
        // Chặn null/chuỗi rỗng trước khi bind vào control; UI5 vẫn escape text khi render.
        return typeof value === "string" && value.trim() ? value.trim() : "Not available";
    }

    function initialsFrom(displayName) {
        // Tạo tối đa hai ký tự avatar; không thay đổi dữ liệu user.
        var parts = displayName.split(/\s+/).filter(Boolean);
        if (!parts.length) return "ID";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function formatExpiry(value) {
        // Chỉ format cho người dùng; thời hạn thật vẫn được kiểm trong LoginSession/auth backend.
        if (!value) return "Session expiry not provided";
        var date = new Date(value);
        if (isNaN(date.getTime())) return "Session expiry not provided";
        return "Session expires " + date.toLocaleString();
    }

    function createHeaderButton() {
        // Entry point dự phòng cho extension muốn nhúng cùng profile button ở host khác.
        var user = currentUser();
        return user ? createProfileButton(user) : null;
    }

    return {
        init: init,
        createHeaderButton: createHeaderButton
    };
});
