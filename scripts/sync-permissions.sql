BEGIN;

INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid()::text, v.r, v.a, v.r || ':' || v.a, 'synced'
FROM (VALUES
  ('api_key','create'),('api_key','read'),('api_key','update'),
  ('channel','create'),('channel','delete'),('channel','read'),('channel','update'),
  ('folio','create'),('folio','delete'),('folio','payment'),('folio','read'),('folio','refund'),('folio','update'),
  ('group','create'),('group','read'),('group','update'),
  ('guest','create'),('guest','delete'),('guest','read'),('guest','update'),
  ('housekeeping','assign'),('housekeeping','read'),('housekeeping','update'),
  ('loyalty','read'),('loyalty','update'),
  ('night_audit','read'),('night_audit','run'),
  ('notification','create'),
  ('property','create'),('property','delete'),('property','read'),('property','update'),
  ('rate','create'),('rate','delete'),('rate','read'),('rate','update'),
  ('report','read'),
  ('reservation','cancel'),('reservation','checkin'),('reservation','checkout'),('reservation','create'),('reservation','delete'),('reservation','read'),('reservation','update'),
  ('room','create'),('room','delete'),('room','read'),('room','update'),
  ('room_type','create'),('room_type','delete'),('room_type','read'),('room_type','update'),
  ('sc_beo','approve'),('sc_beo','manage'),('sc_beo','read'),('sc_beo','sign'),
  ('sc_catalog','manage'),
  ('sc_client','create'),('sc_client','delete'),('sc_client','read'),('sc_client','update'),
  ('sc_event','create'),('sc_event','delete'),('sc_event','read'),('sc_event','update'),
  ('sms','read'),('sms','send'),
  ('task','assign'),('task','create'),('task','delete'),('task','read'),('task','update'),
  ('task_rule','manage'),('task_rule','read'),
  ('user','create'),('user','delete'),('user','read'),('user','update')
) AS v(r, a)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid()::text, r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r."tenantId" IS NULL AND r.name IN ('Admin','Manager')
  AND NOT (r.name = 'Manager' AND p.resource = 'api_key')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid()::text, r.id, p.id
FROM roles r JOIN permissions p ON p.resource || ':' || p.action IN (
  'reservation:create','reservation:read','reservation:update','reservation:checkin','reservation:checkout','reservation:cancel',
  'guest:create','guest:read','guest:update',
  'folio:create','folio:read','folio:payment',
  'room:read','room_type:read','property:read',
  'rate:read','report:read','sms:read','notification:read','channel:read','night_audit:read',
  'housekeeping:read','housekeeping:update',
  'loyalty:read','loyalty:update',
  'task:read','task:update',
  'group:read','sc_event:read','sc_client:read'
)
WHERE r."tenantId" IS NULL AND r.name = 'Staff'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;
