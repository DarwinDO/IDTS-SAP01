# Knowledge: `scripts/qa/check-agent-rules.js`

## English

This small repository check prevents the modular agent-guidance refactor from silently drifting. It verifies that every required Markdown rule exists, has skill-style YAML front matter, and is routed from `AGENTS.md`.

It does not interpret the rules or prove an agent followed them. The companion PR evidence and mandatory Ponytail policy make use of those rules reviewable by people.

## Tiếng Việt

Script nhỏ này ngăn refactor agent guidance dạng module bị lệch mà không ai biết. Nó kiểm tra từng rule Markdown bắt buộc có tồn tại, có YAML front matter theo kiểu skill, và được `AGENTS.md` route tới.

Script không diễn giải nội dung rule hoặc chứng minh agent đã làm theo. PR evidence và policy Ponytail bắt buộc là lớp bổ sung để con người có thể review việc áp dụng rule.
