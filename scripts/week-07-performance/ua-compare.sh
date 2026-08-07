#!/usr/bin/env bash
# 같은 URL에 일반 UA와 페이스북 크롤러 UA로 요청해 metadata 응답 시점을 비교한다.
# crawler는 metadata가 데이터를 기다리는 비용을 그대로 받는다.
#
#   ./scripts/week-07-performance/ua-compare.sh /products
#   APP_ORIGIN=http://127.0.0.1:9 ./scripts/week-07-performance/ua-compare.sh /products
set -euo pipefail

origin="${APP_ORIGIN:-http://localhost:3000}"
path="${1:-/}"
url="${origin}${path}"

echo "URL: ${url}"

# 한쪽이 실패해도 나머지를 봐야 비교가 되므로 종료 코드로 중단하지 않는다.
# 연결 실패는 status=000으로 드러난다.
curl -s -o /dev/null \
  -w 'normal    start=%{time_starttransfer}s total=%{time_total}s status=%{http_code}\n' "$url" || true
curl -s -o /dev/null -A 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' \
  -w 'facebook  start=%{time_starttransfer}s total=%{time_total}s status=%{http_code}\n' "$url" || true
