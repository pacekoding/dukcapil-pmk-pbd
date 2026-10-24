BEGIN;
-- Back up documents and uploads before explicitly reverting this module.
DROP TABLE dokumen_kegiatan_lampiran;
DROP TABLE lampiran_kegiatan;
DROP TABLE peserta_dokumen_kegiatan;
DROP TABLE dokumen_kegiatan_pegawai;
DROP TABLE dokumen_kegiatan;
ALTER TABLE spd DROP COLUMN activity_execution_id;
ALTER TABLE surat_tugas DROP COLUMN activity_execution_id;
DROP TABLE pelaksanaan_kegiatan;
COMMIT;
