#!/usr/bin/env bash
set -u

TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" \
  -d '{"tenantSlug":"demo-hotel","email":"admin@demo.com","password":"admin123"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log((j.data&&j.data.token)||j.token||'')})")

GID=$(curl -s http://localhost:3001/v1/crm/overview -H "Authorization: Bearer $TOKEN" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log((j.topGuests&&j.topGuests[0]&&j.topGuests[0].id)||'')})")
echo "top guest: $GID"

AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"
B=http://localhost:3001/v1/crm

curl -s -o /dev/null -w '360:      %{http_code}\n' "$B/guests/$GID/360" -H "$AUTH"
curl -s -o /dev/null -w 'timeline: %{http_code}\n' "$B/guests/$GID/timeline" -H "$AUTH"
curl -s -X POST "$B/guests/$GID/notes" -H "$AUTH" -H "$CT" -d '{"body":"gate note","pinned":true}' -o /dev/null -w 'note:     %{http_code}\n'
curl -s -X PATCH "$B/guests/$GID" -H "$AUTH" -H "$CT" -d '{"tags":["vip"],"vipStatus":"gold"}' -o /dev/null -w 'patch:    %{http_code}\n'
ASSIGNEE=$(curl -s "$B/assignees" -H "$AUTH" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log((j[0]&&j[0].id)||'')})")
curl -s -X POST "$B/follow-ups" -H "$AUTH" -H "$CT" -d "{\"guestId\":\"$GID\",\"assigneeId\":\"$ASSIGNEE\",\"title\":\"gate follow-up\"}" -o /dev/null -w 'followup: %{http_code}\n'
