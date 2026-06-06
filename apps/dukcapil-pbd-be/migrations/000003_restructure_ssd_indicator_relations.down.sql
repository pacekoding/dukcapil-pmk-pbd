DROP INDEX IF EXISTS idx_ssd_indicator_variables_variable;
DROP INDEX IF EXISTS idx_ssd_indicator_variables_indicator;
DROP INDEX IF EXISTS idx_ssd_indicators_ssd_sort_order;

ALTER TABLE ssd_indicators
DROP CONSTRAINT IF EXISTS ssd_indicators_ssd_fk;

ALTER TABLE ssd_indicators
DROP COLUMN IF EXISTS ssd_id;

DROP TABLE IF EXISTS ssd_indicator_variables;
