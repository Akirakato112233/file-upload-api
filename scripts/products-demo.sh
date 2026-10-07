#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://localhost:3000}"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

request() {
  local label="$1"
  shift
  printf '\n%s\n' "$label"
  local status
  status="$(curl --silent --show-error --output "$temp_dir/response.json" --write-out '%{http_code}' "$@")"
  printf 'HTTP %s\n' "$status"
  if [[ -s "$temp_dir/response.json" ]]; then
    cat "$temp_dir/response.json"
    printf '\n'
  fi
  case "$status" in 200|201|204) ;; *) exit 1 ;; esac
}

request '1. GET /api/products' "$base_url/api/products"
request '2. POST /api/products' -X POST -H 'Content-Type: application/json' \
  -d '{"name":"Desk lamp","price":799,"stock":4,"category":"electronics"}' "$base_url/api/products"
product_id="$(node -p "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')).id" "$temp_dir/response.json")"
request "3. GET /api/products/$product_id" "$base_url/api/products/$product_id"
request "4. PUT /api/products/$product_id" -X PUT -H 'Content-Type: application/json' \
  -d '{"name":"Updated lamp","price":899,"stock":5,"category":"electronics"}' "$base_url/api/products/$product_id"
request "5. PATCH /api/products/$product_id" -X PATCH -H 'Content-Type: application/json' \
  -d '{"price":699}' "$base_url/api/products/$product_id"
request "6. DELETE /api/products/$product_id" -X DELETE "$base_url/api/products/$product_id"
