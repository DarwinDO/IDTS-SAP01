# Knowledge: `ActiveUserDetails.fragment.xml`

## English

The details toolbar exposes `Link existing identity` only when `activeUsers>/details/linkEligible` is true. Existing lifecycle buttons remain separate. No provider, Role Collection, JWT, platform ID, or identity tuple is rendered.

## Tiếng Việt

Toolbar details chỉ hiện `Link existing identity` khi `activeUsers>/details/linkEligible` là true. Các nút lifecycle hiện có vẫn tách biệt. UI không render provider, Role Collection, JWT, platform ID hoặc identity tuple.
## Gate 6.2 lifecycle ownership / Ownership lifecycle Gate 6.2

Active User details is the lifecycle action owner. It keeps Change Role, Suspend, Reactivate and Revoke under their existing state guards and adds Manage Responsibilities only for an active Developer with an associated request. Request rows no longer duplicate these actions.

Active User details là nơi sở hữu action lifecycle. Dialog giữ Change Role, Suspend, Reactivate và Revoke theo guard state hiện có, đồng thời chỉ hiện Manage Responsibilities cho Developer active có request liên kết. Dòng request không còn lặp các action này.
