# Knowledge: `srv/user-admin/delivery.js`

The onboarding delivery worker claims one durable delivery row, reloads its invitation, regenerates the signed link from persisted nonce plus the private signing key, and sends it through the existing provider adapter. The raw invitation token and message body are not persisted.

Provider failures use the shared sanitized error mapping and retry schedule. Delivery state records only `FAILED`, retry time, safe code/summary, and cleared locks. The same safe code/summary is mirrored to the parent request so the administration screen can show a useful failure state; a later successful send clears those request fields. Provider secrets, raw errors, response bodies, endpoints, tokens, and message bodies are excluded. Expired or missing invitations become `SKIPPED`.
