BEGIN;

CREATE TABLE organisasi_bidang (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL CHECK (BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')) <> ''),
    code TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX organisasi_bidang_name_unique ON organisasi_bidang (LOWER(BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g'))));

CREATE TABLE organisasi_seksi (
    id BIGSERIAL PRIMARY KEY,
    bidang_id BIGINT NOT NULL REFERENCES organisasi_bidang(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK (BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')) <> ''),
    code TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, bidang_id)
);
CREATE UNIQUE INDEX organisasi_seksi_name_unique ON organisasi_seksi (bidang_id, LOWER(BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g'))));

CREATE TABLE organisasi_jabatan (
    id BIGSERIAL PRIMARY KEY,
    bidang_id BIGINT NOT NULL REFERENCES organisasi_bidang(id) ON DELETE RESTRICT,
    seksi_id BIGINT,
    name TEXT NOT NULL CHECK (BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')) <> ''),
    code TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, bidang_id),
    FOREIGN KEY (seksi_id, bidang_id) REFERENCES organisasi_seksi(id, bidang_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX organisasi_jabatan_name_unique ON organisasi_jabatan (bidang_id, COALESCE(seksi_id, 0), LOWER(BTRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g'))));
CREATE INDEX organisasi_jabatan_seksi_idx ON organisasi_jabatan(seksi_id);

-- Keep the original text columns. Only complete, unambiguous parent paths are mapped.
ALTER TABLE arsip_pegawai
    ADD COLUMN bidang_id BIGINT REFERENCES organisasi_bidang(id) ON DELETE RESTRICT,
    ADD COLUMN seksi_id BIGINT,
    ADD COLUMN jabatan_id BIGINT,
    ADD CONSTRAINT arsip_pegawai_seksi_bidang_fk FOREIGN KEY (seksi_id, bidang_id) REFERENCES organisasi_seksi(id, bidang_id) ON DELETE RESTRICT,
    ADD CONSTRAINT arsip_pegawai_jabatan_bidang_fk FOREIGN KEY (jabatan_id, bidang_id) REFERENCES organisasi_jabatan(id, bidang_id) ON DELETE RESTRICT,
    ADD CONSTRAINT arsip_pegawai_organization_parent_check CHECK ((seksi_id IS NULL AND jabatan_id IS NULL) OR bidang_id IS NOT NULL);
CREATE INDEX arsip_pegawai_bidang_idx ON arsip_pegawai(bidang_id);
CREATE INDEX arsip_pegawai_seksi_idx ON arsip_pegawai(seksi_id);
CREATE INDEX arsip_pegawai_jabatan_idx ON arsip_pegawai(jabatan_id);

INSERT INTO organisasi_bidang (name)
SELECT MIN(BTRIM(REGEXP_REPLACE(bidang, '\s+', ' ', 'g')))
FROM arsip_pegawai WHERE BTRIM(REGEXP_REPLACE(bidang, '\s+', ' ', 'g')) <> ''
GROUP BY LOWER(BTRIM(REGEXP_REPLACE(bidang, '\s+', ' ', 'g')));
UPDATE arsip_pegawai p SET bidang_id = b.id FROM organisasi_bidang b
WHERE LOWER(BTRIM(REGEXP_REPLACE(p.bidang, '\s+', ' ', 'g'))) = LOWER(b.name);

INSERT INTO organisasi_seksi (bidang_id, name)
SELECT bidang_id, MIN(BTRIM(REGEXP_REPLACE(unit, '\s+', ' ', 'g')))
FROM arsip_pegawai WHERE bidang_id IS NOT NULL AND BTRIM(REGEXP_REPLACE(unit, '\s+', ' ', 'g')) <> ''
GROUP BY bidang_id, LOWER(BTRIM(REGEXP_REPLACE(unit, '\s+', ' ', 'g')));
UPDATE arsip_pegawai p SET seksi_id = s.id FROM organisasi_seksi s
WHERE p.bidang_id = s.bidang_id AND LOWER(BTRIM(REGEXP_REPLACE(p.unit, '\s+', ' ', 'g'))) = LOWER(s.name);

INSERT INTO organisasi_jabatan (bidang_id, seksi_id, name)
SELECT bidang_id, seksi_id, MIN(BTRIM(REGEXP_REPLACE(jabatan, '\s+', ' ', 'g')))
FROM arsip_pegawai WHERE bidang_id IS NOT NULL AND BTRIM(REGEXP_REPLACE(jabatan, '\s+', ' ', 'g')) <> ''
GROUP BY bidang_id, seksi_id, LOWER(BTRIM(REGEXP_REPLACE(jabatan, '\s+', ' ', 'g')));
UPDATE arsip_pegawai p SET jabatan_id = j.id FROM organisasi_jabatan j
WHERE p.bidang_id = j.bidang_id AND p.seksi_id IS NOT DISTINCT FROM j.seksi_id
AND LOWER(BTRIM(REGEXP_REPLACE(p.jabatan, '\s+', ' ', 'g'))) = LOWER(j.name);

-- Abort instead of silently skipping any nonempty value with a known parent.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM arsip_pegawai WHERE
        (BTRIM(REGEXP_REPLACE(bidang, '\s+', ' ', 'g')) <> '' AND bidang_id IS NULL) OR
        (bidang_id IS NOT NULL AND BTRIM(REGEXP_REPLACE(unit, '\s+', ' ', 'g')) <> '' AND seksi_id IS NULL) OR
        (bidang_id IS NOT NULL AND BTRIM(REGEXP_REPLACE(jabatan, '\s+', ' ', 'g')) <> '' AND jabatan_id IS NULL)) THEN
        RAISE EXCEPTION 'Organization backfill is incomplete';
    END IF;
END $$;
COMMIT;
