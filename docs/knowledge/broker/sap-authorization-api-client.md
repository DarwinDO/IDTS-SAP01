# Knowledge: SAP Authorization API Client

## English

`broker/lib/sap-authorization-api-client.js` is the privileged broker's only HTTP boundary to the SAP Authorization and Trust Management REST API. It accepts only HTTPS base URLs, relative paths, and the `GET`/`PATCH` methods used by the reviewed user-management contract. The API credential and access token stay inside the broker process.

The client never retries a PATCH. It converts provider outcomes into fixed safe codes so the CAP operation journal can decide whether a human reconciliation or a bounded retry is allowed:

- request-invalid, denied, missing-resource, conflict, and invalid-response outcomes are not retryable;
- rate limiting, timeout, network failure, and provider 5xx outcomes are retryable;
- an ambiguous PATCH must be reconciled by reading provider state before another write.

Provider response bodies, URLs, headers, tokens, user IDs, group IDs, and raw errors must never be returned, logged, or persisted.

## Vietnamese

`broker/lib/sap-authorization-api-client.js` là ranh giới HTTP duy nhất của broker đặc quyền tới SAP Authorization and Trust Management REST API. Client chỉ chấp nhận HTTPS base URL, relative path và hai method `GET`/`PATCH` trong contract quản lý user đã review. API credential và access token chỉ tồn tại trong process của broker.

Client tuyệt đối không tự retry PATCH. Kết quả provider được đổi thành safe code cố định để operation journal của CAP quyết định khi nào cần human reconciliation hoặc bounded retry:

- request sai, bị từ chối, resource thiếu, conflict và response sai format không được retry;
- rate limit, timeout, network failure và provider 5xx có thể retry có kiểm soát;
- PATCH có kết quả mơ hồ phải đọc lại provider state trước một write khác.

Không được return, log hoặc persist provider body, URL, header, token, user ID, group ID hay raw error.
