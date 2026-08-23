# Knowledge: `srv/access/identity-readiness.js`

## English

`hasActiveIdentityAccess(user, requests)` is the shared fail-closed readiness predicate. It requires an active internal User, a non-empty immutable identity hash, and exactly one `ACTIVE` onboarding request whose `activeUser_ID` and `identityKeyHash` match that User. Zero or multiple matches are not ready.

`readActiveIdentityAccessByUser(tx, userIDs)` reads only the safe internal readiness inputs and groups active requests by User ID for read models and assignment validation. It does not call a provider or mutate data.

## Tiếng Việt

`hasActiveIdentityAccess(user, requests)` là predicate readiness dùng chung và fail-closed. Nó yêu cầu User nội bộ đang active, có immutable identity hash không rỗng và đúng một onboarding request `ACTIVE` có `activeUser_ID` cùng `identityKeyHash` khớp User. Không có hoặc có nhiều match đều chưa ready.

`readActiveIdentityAccessByUser(tx, userIDs)` chỉ đọc input nội bộ an toàn và group request active theo User ID cho read model và validation assignment. Hàm không gọi provider và không mutate dữ liệu.

### Important source anchors

- **Location**: `srv/access/identity-readiness.js:8` `hasActiveIdentityAccess(...)`
  **IDTS concept**: The one authoritative rule for whether a Developer may receive new access-dependent work.
  **Impact if broken**: Unlinked or ambiguously linked Developers could enter Active Users readiness, direct assignment, or Smart Assign.
  **Must check together**: `srv/user-admin/active-users.js`, `srv/bug-service/bug-write.js`, `srv/bug-service/read-models.js`, and Gate 3B focused fixtures.
