package repository

import (
	"context"
	"fmt"
	"strings"

	"dukcapil-pbd-be/internal/model"
)

const publicOtsusSelect = `o.id, o.tahun_anggaran,
 CASE WHEN POSITION(' - ' IN s.subkegiatan)>0 THEN SPLIT_PART(s.subkegiatan,' - ',1) ELSE '' END AS kode_subkegiatan,
 CASE WHEN POSITION(' - ' IN s.subkegiatan)>0 THEN SUBSTRING(s.subkegiatan FROM POSITION(' - ' IN s.subkegiatan)+3) ELSE s.subkegiatan END AS nama_subkegiatan,
 s.program, s.kegiatan, s.bidang, o.kabupaten_kota, o.sumber_dana, o.pagu, o.realisasi, o.status, o.updated_at,
 (SELECT COUNT(*) FROM dokumentasi_otsus d WHERE d.otsus_label_id=o.id AND d.is_public) AS jumlah_foto,
 ((SELECT COUNT(*) FROM versi_dpa_otsus d WHERE d.otsus_label_id=o.id AND d.is_public) +
  (SELECT COUNT(*) FROM lpj_otsus l WHERE l.otsus_label_id=o.id AND l.is_public)) AS jumlah_dokumen,
 COALESCE((SELECT '/api/backend/public/otsus-files/' || d.file_id || '/preview' FROM dokumentasi_otsus d WHERE d.otsus_label_id=o.id AND d.is_public ORDER BY d.created_at DESC LIMIT 1),'') AS thumbnail_url`

func (r *OtsusRepository) PublicList(ctx context.Context, p model.PublicOtsusListParams) (model.PublicOtsusListResponse, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.PublicOtsusListResponse{}, err
	}
	var years []string
	if err := db.Model(&model.OtsusLabel{}).Where("is_public", true).Distinct("tahun_anggaran").Order("tahun_anggaran DESC").Pluck("tahun_anggaran", &years).Error; err != nil {
		return model.PublicOtsusListResponse{}, err
	}
	year := strings.TrimSpace(p.Year)
	if year == "" && len(years) > 0 {
		year = years[0]
	}
	page, size := max(p.Page, 1), p.PageSize
	if size <= 0 {
		size = 12
	}
	if size > 50 {
		size = 50
	}
	response := model.PublicOtsusListResponse{
		Year: year, Years: years, Items: make([]model.PublicOtsusItem, 0),
		Kabupaten: make([]string, 0), Page: page, PageSize: size, TotalPages: 1,
		Summary: model.PublicOtsusSummary{Funding: make([]model.PublicOtsusFunding, 0)},
	}
	if year == "" {
		response.Page = 1
		return response, nil
	}

	base := db.Table("labelisasi_otsus o").Joins("JOIN subkegiatan s ON s.id=o.subkegiatan_id").Where("o.is_public AND o.tahun_anggaran=?", year)
	if term := strings.TrimSpace(p.Search); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		base = base.Where("LOWER(CONCAT_WS(' ',s.subkegiatan,s.program,s.kegiatan,s.bidang,o.kabupaten_kota)) LIKE ?", like)
	}
	if value := strings.TrimSpace(p.KabupatenKota); value != "" {
		base = base.Where("o.kabupaten_kota=?", value)
	}
	if value := strings.TrimSpace(p.Status); value != "" {
		base = base.Where("o.status=?", value)
	}
	if value := strings.TrimSpace(p.SumberDana); value != "" {
		base = base.Where("o.sumber_dana=?", value)
	}
	if err := base.Count(&response.Total).Error; err != nil {
		return response, err
	}
	response.TotalPages = int((response.Total + int64(size) - 1) / int64(size))
	if response.TotalPages == 0 {
		response.TotalPages = 1
	}
	if page > response.TotalPages {
		page = response.TotalPages
		response.Page = page
	}
	orders := map[string]string{
		"latest": "o.updated_at DESC", "name": "nama_subkegiatan ASC",
		"budget": "o.pagu DESC", "realization": "o.realisasi DESC",
	}
	order := orders[strings.TrimSpace(p.Sort)]
	if order == "" {
		order = orders["latest"]
	}
	if err := base.Select(publicOtsusSelect).Order(order + ", o.id DESC").Offset((page - 1) * size).Limit(size).Scan(&response.Items).Error; err != nil {
		return response, fmt.Errorf("public otsus list: %w", err)
	}

	if err := db.Table("labelisasi_otsus").Select(`COUNT(*) total,
		COUNT(*) FILTER(WHERE status='SELESAI') selesai,
		COUNT(*) FILTER(WHERE status='BERJALAN') berjalan,
		COUNT(*) FILTER(WHERE status='BELUM_MULAI') belum_mulai,
		COALESCE(SUM(pagu),0) pagu, COALESCE(SUM(realisasi),0) realisasi,
		MAX(updated_at) updated_at`).Where("is_public AND tahun_anggaran=?", year).Scan(&response.Summary).Error; err != nil {
		return response, err
	}
	if err := db.Table("labelisasi_otsus").Select("sumber_dana, COUNT(*) jumlah, COALESCE(SUM(pagu),0) pagu, COALESCE(SUM(realisasi),0) realisasi").Where("is_public AND tahun_anggaran=?", year).Group("sumber_dana").Order("sumber_dana DESC").Scan(&response.Summary.Funding).Error; err != nil {
		return response, err
	}
	if response.Summary.Funding == nil {
		response.Summary.Funding = make([]model.PublicOtsusFunding, 0)
	}
	if err := db.Table("dokumentasi_otsus d").Joins("JOIN labelisasi_otsus o ON o.id=d.otsus_label_id").Where("o.is_public AND o.tahun_anggaran=? AND d.is_public", year).Count(&response.Summary.Foto).Error; err != nil {
		return response, err
	}
	var dpaCount, lpjCount int64
	if err := db.Table("versi_dpa_otsus d").Joins("JOIN labelisasi_otsus o ON o.id=d.otsus_label_id").Where("o.is_public AND o.tahun_anggaran=? AND d.is_public", year).Count(&dpaCount).Error; err != nil {
		return response, err
	}
	if err := db.Table("lpj_otsus l").Joins("JOIN labelisasi_otsus o ON o.id=l.otsus_label_id").Where("o.is_public AND o.tahun_anggaran=? AND l.is_public", year).Count(&lpjCount).Error; err != nil {
		return response, err
	}
	response.Summary.Dokumen = dpaCount + lpjCount
	if err := db.Table("labelisasi_otsus").Where("is_public AND tahun_anggaran=? AND kabupaten_kota<>''", year).Distinct("kabupaten_kota").Order("kabupaten_kota").Pluck("kabupaten_kota", &response.Kabupaten).Error; err != nil {
		return response, err
	}
	return response, nil
}

func (r *OtsusRepository) PublicDetail(ctx context.Context, id int64, year string) (model.PublicOtsusDetail, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.PublicOtsusDetail{}, err
	}
	out := model.PublicOtsusDetail{Photos: make([]model.PublicOtsusFile, 0), Documents: make([]model.PublicOtsusFile, 0)}
	query := db.Table("labelisasi_otsus o").Joins("JOIN subkegiatan s ON s.id=o.subkegiatan_id").Where("o.id=? AND o.is_public", id)
	if strings.TrimSpace(year) != "" {
		query = query.Where("o.tahun_anggaran=?", strings.TrimSpace(year))
	}
	if err := query.Select(publicOtsusSelect).Scan(&out.Item).Error; err != nil {
		return out, err
	}
	if out.Item.ID == 0 {
		return out, ErrOtsusNotFound
	}
	if err := db.Table("labelisasi_otsus").Where("id=? AND is_public", id).Pluck("keterangan", &out.Keterangan).Error; err != nil {
		return out, err
	}
	type fileRow struct {
		ID, FileSize                   int64
		Title, Type, MimeType, Caption string
		Version                        int
		CreatedAt                      string
	}
	var photos []fileRow
	if err := db.Table("dokumentasi_otsus d").Select("f.id, COALESCE(NULLIF(d.caption,''),'Dokumentasi Kegiatan') title, 'PHOTO' type, f.mime_type, f.file_size, d.caption, d.created_at::text created_at").Joins("JOIN stored_files f ON f.id=d.file_id AND f.deleted_at IS NULL").Where("d.otsus_label_id=? AND d.is_public", id).Order("d.created_at DESC").Scan(&photos).Error; err != nil {
		return out, err
	}
	var dpa []fileRow
	if err := db.Table("versi_dpa_otsus d").Select("f.id, CASE d.jenis WHEN 'AWAL' THEN 'DPA Awal' WHEN 'PERGESERAN' THEN 'DPA Pergeseran' ELSE 'DPA Perubahan' END title, 'DPA' type, d.versi version, f.mime_type, f.file_size, d.uploaded_at::text created_at").Joins("JOIN stored_files f ON f.id=d.file_id AND f.deleted_at IS NULL").Where("d.otsus_label_id=? AND d.is_public", id).Order("d.versi ASC").Scan(&dpa).Error; err != nil {
		return out, err
	}
	var lpj []fileRow
	if err := db.Table("lpj_otsus l").Select("f.id, 'Laporan Pertanggungjawaban' title, 'LPJ' type, f.mime_type, f.file_size, l.updated_at::text created_at").Joins("JOIN stored_files f ON f.id=l.file_id AND f.deleted_at IS NULL").Where("l.otsus_label_id=? AND l.is_public", id).Scan(&lpj).Error; err != nil {
		return out, err
	}
	convert := func(rows []fileRow) []model.PublicOtsusFile {
		files := make([]model.PublicOtsusFile, 0, len(rows))
		for _, row := range rows {
			files = append(files, model.PublicOtsusFile{
				ID: row.ID, Title: row.Title, Type: row.Type, Version: row.Version,
				MimeType: row.MimeType, FileSize: row.FileSize, Caption: row.Caption, CreatedAt: row.CreatedAt,
				PreviewURL:  fmt.Sprintf("/api/backend/public/otsus-files/%d/preview", row.ID),
				DownloadURL: fmt.Sprintf("/api/backend/public/otsus-files/%d/download", row.ID),
			})
		}
		return files
	}
	out.Photos = convert(photos)
	out.Documents = append(convert(dpa), convert(lpj)...)
	return out, nil
}

func (r *StoredFileRepository) PublicOtsusByID(ctx context.Context, id int64) (model.StoredFile, bool, error) {
	db, err := r.session(ctx)
	if err != nil {
		return model.StoredFile{}, false, err
	}
	file, found, err := storedFileByID(db, id)
	if err != nil || !found {
		return file, found, err
	}
	var count int64
	var result error
	switch file.RelatedEntityType {
	case "otsus_documentation":
		result = db.Table("dokumentasi_otsus d").Joins("JOIN labelisasi_otsus o ON o.id=d.otsus_label_id").Where("d.id=? AND d.file_id=? AND d.is_public AND o.is_public", file.RelatedEntityID, id).Count(&count).Error
	case "lpj_otsus":
		result = db.Table("lpj_otsus l").Joins("JOIN labelisasi_otsus o ON o.id=l.otsus_label_id").Where("l.id=? AND l.file_id=? AND l.is_public AND o.is_public", file.RelatedEntityID, id).Count(&count).Error
	case "otsus_dpa":
		result = db.Table("versi_dpa_otsus d").Joins("JOIN labelisasi_otsus o ON o.id=d.otsus_label_id").Where("d.id=? AND d.file_id=? AND d.is_public AND o.is_public", file.RelatedEntityID, id).Count(&count).Error
	}
	if result != nil {
		return model.StoredFile{}, false, result
	}
	if count == 0 {
		return model.StoredFile{}, false, nil
	}
	return file, true, nil
}
