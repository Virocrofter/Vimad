-- Feature Flags v2 follow-up: overrides hold typed values (bool/string/number/json),
-- not just booleans. P02 defined "value" BOOLEAN — widen to JSONB, preserving data.
ALTER TABLE "feature_flag_overrides"
  ALTER COLUMN "value" TYPE JSONB USING to_jsonb("value");
