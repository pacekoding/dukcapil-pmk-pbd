CREATE TABLE IF NOT EXISTS outgoing_letters (
	id BIGSERIAL PRIMARY KEY,
	letter_type VARCHAR(32) NOT NULL,
	classification VARCHAR(32) NOT NULL DEFAULT 'segera',
	letter_number TEXT NOT NULL DEFAULT '',
	letter_date DATE NOT NULL,
	recipient TEXT NOT NULL DEFAULT '',
	subject TEXT NOT NULL DEFAULT '',
	opening_text TEXT NOT NULL DEFAULT '',
	section_aaa JSONB NOT NULL DEFAULT '{}'::JSONB,
	section_bbb TEXT NOT NULL DEFAULT '',
	section_ccc TEXT NOT NULL DEFAULT '',
	section_ddd TEXT NOT NULL DEFAULT '',
	sender_agency TEXT NOT NULL DEFAULT '',
	from_text TEXT NOT NULL DEFAULT '',
	to_text TEXT NOT NULL DEFAULT '',
	copy_to JSONB NOT NULL DEFAULT '[]'::JSONB,
	signatory_name TEXT NOT NULL DEFAULT '',
	signatory_position TEXT NOT NULL DEFAULT '',
	signatory_rank TEXT NOT NULL DEFAULT '',
	signatory_nip TEXT NOT NULL DEFAULT '',
	status VARCHAR(16) NOT NULL DEFAULT 'draft',
	created_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
	updated_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT outgoing_letters_type_check CHECK (letter_type IN ('radiogram')),
	CONSTRAINT outgoing_letters_status_check CHECK (status IN ('draft', 'selesai')),
	CONSTRAINT outgoing_letters_classification_check CHECK (
		classification IN ('biasa', 'penting', 'segera', 'sangat_segera')
	),
	CONSTRAINT outgoing_letters_letter_date_check CHECK (letter_date >= DATE '2000-01-01'),
	CONSTRAINT outgoing_letters_done_required_check CHECK (
		status = 'draft'
		OR (
			BTRIM(letter_number) <> ''
			AND BTRIM(recipient) <> ''
			AND BTRIM(opening_text) <> ''
			AND BTRIM(section_bbb) <> ''
			AND BTRIM(section_ccc) <> ''
			AND BTRIM(section_ddd) <> ''
			AND BTRIM(signatory_name) <> ''
			AND BTRIM(signatory_position) <> ''
		)
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outgoing_letters_number_unique
	ON outgoing_letters (LOWER(letter_number))
	WHERE BTRIM(letter_number) <> '';

CREATE INDEX IF NOT EXISTS idx_outgoing_letters_created_at
	ON outgoing_letters (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_outgoing_letters_filters
	ON outgoing_letters (letter_type, status, letter_date DESC);
