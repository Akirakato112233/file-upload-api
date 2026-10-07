#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
BASE_URL="${BASE_URL:-http://localhost:3000}"
mkdir -p evidence/responses evidence/downloads
exec > >(tee evidence/terminal-output.txt) 2>&1
printf 'File Upload API v1.0.0 | curl demonstration\n'
date -u '+UTC: %Y-%m-%dT%H:%M:%SZ'
printf 'Environment: %s\n' "${CODESPACE_NAME:-local}"

printf '\n1. Single upload\n$ curl -F "file=@./avatar.png" %s/api/files\n' "$BASE_URL"
curl --fail-with-body -sS -w '\nHTTP %{http_code}\n' -o evidence/responses/single.json \
  -F 'file=@./avatar.png' "$BASE_URL/api/files"
cat evidence/responses/single.json
FILENAME="$(node -p 'JSON.parse(require("fs").readFileSync("evidence/responses/single.json", "utf8")).filename')"

printf '\n\n2. Multiple upload\n$ curl -F "files=@./a.png" -F "files=@./b.pdf" %s/api/files/multiple\n' "$BASE_URL"
curl --fail-with-body -sS -w '\nHTTP %{http_code}\n' \
  -F 'files=@./a.png' -F 'files=@./b.pdf' "$BASE_URL/api/files/multiple"

printf '\n3. List images\n$ curl %s/api/files/multiple\n' "$BASE_URL"
curl --fail-with-body -sS -w '\nHTTP %{http_code}\n' "$BASE_URL/api/files/multiple"

printf '\n4. Download\n$ curl -OJ %s/api/files/%s\n' "$BASE_URL" "$FILENAME"
(cd evidence/downloads && curl --fail-with-body -sS -OJ "$BASE_URL/api/files/$FILENAME")
cmp avatar.png "evidence/downloads/$FILENAME"
printf 'PASS: downloaded bytes match avatar.png\n'

printf '\n5. Delete\n$ curl -X DELETE -i %s/api/files/%s\n' "$BASE_URL" "$FILENAME"
curl --fail-with-body -sS -X DELETE -i "$BASE_URL/api/files/$FILENAME"
STATUS="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/files/$FILENAME")"
test "$STATUS" = 404
printf '\nPASS: deleted file now returns HTTP 404\n'

printf '\nUploads folder after the demonstration\n$ ls -lh uploads/\n'
ls -lh uploads/
printf '\nPASS: all five curl operations completed\n'
