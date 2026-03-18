-- Cast user_id columns from varchar to bigint where they already exist as varchar
ALTER TABLE IF EXISTS seizures ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE IF EXISTS triggers ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE IF EXISTS medications ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE IF EXISTS medication_logs ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
