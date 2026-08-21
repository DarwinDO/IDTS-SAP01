# Knowledge: `db/data/idts.cap-UserOnboardingStatuses.csv`

## English

Gate 3 adds one additive onboarding status row:

`SUSPENDED,Suspended,IDTS-local access is suspended pending an explicit reactivation.,105,true,1`

The existing fourteen status rows remain unchanged. The display order places `SUSPENDED` after the earlier lifecycle statuses, and the status is active for the service contract. The CSV is a value-list seed, not a migration or provider state store. The local suspension transaction and reactivation broker proof remain authoritative for user access.

## Tiếng Việt

Gate 3 thêm một row status onboarding theo hướng additive:

`SUSPENDED,Suspended,IDTS-local access is suspended pending an explicit reactivation.,105,true,1`

Mười bốn row status cũ được giữ nguyên. Display order đặt `SUSPENDED` sau các status lifecycle trước đó và status này active trong service contract. CSV chỉ là seed value-list, không phải migration hay nơi lưu provider state. Transaction suspend local và broker proof khi reactivate mới là nguồn quyết định access user.

## Verification

The lifecycle contract test asserts the exact fifteen-row set, preserves the previous fourteen rows, checks the description/order/active values, and rejects duplicate codes.
