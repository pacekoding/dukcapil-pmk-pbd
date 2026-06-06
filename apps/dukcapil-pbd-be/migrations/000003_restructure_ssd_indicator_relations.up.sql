ALTER TABLE ssd_indicators
ADD COLUMN IF NOT EXISTS ssd_id BIGINT;

UPDATE ssd_indicators AS i
SET ssd_id = v.ssd_id
FROM ssd_variables AS v
WHERE i.variable_id = v.id
  AND i.ssd_id IS NULL;

CREATE TABLE IF NOT EXISTS ssd_indicator_variables (
	indicator_id BIGINT NOT NULL REFERENCES ssd_indicators(id) ON DELETE CASCADE,
	variable_id BIGINT NOT NULL REFERENCES ssd_variables(id) ON DELETE CASCADE,
	tahun_anggaran VARCHAR(4) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (indicator_id, variable_id),
	CONSTRAINT ssd_indicator_variables_tahun_anggaran_check CHECK (tahun_anggaran ~ '^\d{4}$')
);

INSERT INTO ssd_indicator_variables (indicator_id, variable_id, tahun_anggaran)
SELECT i.id, i.variable_id, i.tahun_anggaran
FROM ssd_indicators AS i
WHERE i.variable_id IS NOT NULL
ON CONFLICT (indicator_id, variable_id) DO NOTHING;

ALTER TABLE ssd_indicators
ALTER COLUMN ssd_id SET NOT NULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.table_constraints
		WHERE constraint_name = 'ssd_indicators_ssd_fk'
		  AND table_name = 'ssd_indicators'
	) THEN
		ALTER TABLE ssd_indicators
		ADD CONSTRAINT ssd_indicators_ssd_fk
		FOREIGN KEY (ssd_id) REFERENCES ssd(id) ON DELETE CASCADE;
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ssd_indicators_ssd_sort_order ON ssd_indicators(ssd_id, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_ssd_indicator_variables_indicator ON ssd_indicator_variables(indicator_id);
CREATE INDEX IF NOT EXISTS idx_ssd_indicator_variables_variable ON ssd_indicator_variables(variable_id);
