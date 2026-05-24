#!/usr/bin/env bash
set -euo pipefail

API="${API_URL:-https://clear-clever-backend.onrender.com}"
PASS="${TEST_PASSWORD:-password}"

login() {
  curl -sS --max-time 90 -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$PASS\"}"
}

echo "=== Health ==="
HEALTH=$(curl -sS --max-time 90 "$API/api/health")
python3 -c "import json,sys; b=json.loads(sys.argv[1]); assert b['success']; print('health OK')" "$HEALTH"

echo "=== Employee login ==="
EMP=$(login "admin@clearclever.com")
EMP_TOKEN=$(python3 -c "import json,sys; b=json.loads(sys.argv[1]); assert b['data']['user']['role']=='admin'; print(b['data']['token'])" "$EMP")
echo "employee token OK"

echo "=== Superadmin login ==="
SA=$(login "superadmin@clearclever.com")
SA_TOKEN=$(python3 -c "import json,sys; b=json.loads(sys.argv[1]); assert b['data']['user']['role']=='superadmin'; print(b['data']['token'])" "$SA")
echo "superadmin token OK"

echo "=== Pending policies ==="
PENDING=$(curl -sS --max-time 90 "$API/api/admin/policies/pending" -H "Authorization: Bearer $EMP_TOKEN")
python3 -c "import json,sys; b=json.loads(sys.argv[1]); assert b['success']; print('pending count:', b['data']['count'])" "$PENDING"

echo "=== Users list ==="
USERS=$(curl -sS --max-time 90 "$API/api/admin/users" -H "Authorization: Bearer $EMP_TOKEN")
python3 -c "import json,sys; b=json.loads(sys.argv[1]); assert b['success']; assert b['data']['count']>0; print('users count:', b['data']['count'])" "$USERS"

echo "=== Analytics ==="
ANALYTICS=$(curl -sS --max-time 90 "$API/api/admin/analytics" -H "Authorization: Bearer $EMP_TOKEN")
python3 -c "import json,sys; b=json.loads(sys.argv[1]); assert b['success']; d=b['data']; print('users total:', d['users']['total']); print('policies pending:', d['policies']['pending'])" "$ANALYTICS"

echo "=== Seeker forbidden on admin route ==="
SEEKER=$(login "seeker@clearclever.com")
SEEKER_TOKEN=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['data']['token'])" "$SEEKER")
HTTP=$(curl -sS --max-time 90 -o /tmp/seeker_admin.json -w "%{http_code}" "$API/api/admin/users" -H "Authorization: Bearer $SEEKER_TOKEN")
python3 -c "import sys; code=int(sys.argv[1]); assert code in (401,403); print('seeker blocked HTTP', code)" "$HTTP"

echo "=== Superadmin users ==="
SA_USERS=$(curl -sS --max-time 90 "$API/api/admin/users" -H "Authorization: Bearer $SA_TOKEN")
python3 -c "import json,sys; b=json.loads(sys.argv[1]); assert b['success']; print('superadmin users OK')" "$SA_USERS"

echo ""
echo "All admin portal smoke checks passed."
