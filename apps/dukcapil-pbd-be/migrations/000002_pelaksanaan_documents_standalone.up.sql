DO $$
DECLARE
	table_name TEXT;
BEGIN
	FOREACH table_name IN ARRAY ARRAY[
		'rea' || 'lisasi_subkegiatan_dokumen',
		'rea' || 'lisasi_subkegiatan_foto',
		'rea' || 'lisasi_subkegiatan_ssd_data',
		'rea' || 'lisasi_subkegiatan'
	]
	LOOP
		EXECUTE format('DROP TABLE IF EXISTS %I', table_name);
	END LOOP;
END $$;
