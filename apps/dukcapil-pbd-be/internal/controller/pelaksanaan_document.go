package controller

import (
	"context"
	"fmt"
	"mime"
	"net/http"
	"net/url"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

var pelaksanaanDocumentTahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)

var allowedArsipSources = map[string]bool{
	"sidoka":        true,
	"sidak":         true,
	"arsip_pegawai": true,
}

var allowedArsipBidang = map[string]bool{
	"sekretariat": true,
	"dukcapil":    true,
	"pmk":         true,
}

type PelaksanaanDocumentStore interface {
	Create(ctx context.Context, tahunAnggaran string, payload model.PelaksanaanDocumentPayload) (model.PelaksanaanDocumentItem, error)
	ListDocuments(ctx context.Context, params model.PelaksanaanDocumentListParams) (model.PelaksanaanDocumentListResponse, error)
	DocumentByID(ctx context.Context, tahunAnggaran string, id int64) (model.PelaksanaanDocumentItem, bool, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.UpdatePelaksanaanDocumentPayload) (model.PelaksanaanDocumentItem, bool, error)
	Delete(ctx context.Context, tahunAnggaran string, id int64) (model.PelaksanaanDocumentItem, bool, error)
}

type PelaksanaanDocumentController struct {
	documents PelaksanaanDocumentStore
	files     *fileasset.Service
}

func NewPelaksanaanDocumentController(
	documents PelaksanaanDocumentStore,
	files ...*fileasset.Service,
) *PelaksanaanDocumentController {
	var service *fileasset.Service
	if len(files) > 0 {
		service = files[0]
	}
	return &PelaksanaanDocumentController{documents: documents, files: service}
}

func (p *PelaksanaanDocumentController) ListDocuments(c echo.Context) error {
	params, err := pelaksanaanDocumentListParams(c)
	if err != nil {
		return err
	}

	response, err := p.documents.ListDocuments(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen pelaksanaan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (p *PelaksanaanDocumentController) UploadDocument(c echo.Context) error {
	tahunAnggaran, err := pelaksanaanDocumentTahunAnggaran(c)
	if err != nil {
		return err
	}
	subkegiatanID, err := parseOptionalDocumentInt64(c.FormValue("subkegiatan_id"), "subkegiatan tidak valid")
	if err != nil {
		return err
	}
	sumberAplikasi := documentFormValue(c, "sumber_aplikasi", "sumberAplikasi", "source_app", "sourceApp")
	if sumberAplikasi == "" {
		sumberAplikasi = "sidoka"
	}
	if err := validateArsipSource(sumberAplikasi); err != nil {
		return err
	}
	bidang := documentFormValue(c, "bidang")
	if bidang == "" {
		bidang = defaultBidangForArsipSource(sumberAplikasi)
	}
	if err := validateArsipBidang(bidang); err != nil {
		return err
	}
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}
	file, err := savePelaksanaanDocumentUpload(
		c,
		p.files,
		tahunAnggaran,
		sumberAplikasi,
		bidang,
		claims.UserID,
	)
	if err != nil {
		return err
	}

	nama := strings.TrimSpace(c.FormValue("nama"))
	if nama == "" {
		nama = strings.TrimSpace(c.FormValue("nama_dokumen"))
	}
	if nama == "" {
		nama = file.OriginalFilename
	}

	document, err := p.documents.Create(c.Request().Context(), tahunAnggaran, model.PelaksanaanDocumentPayload{
		File:           &file,
		SumberAplikasi: sumberAplikasi,
		Bidang:         bidang,
		SubkegiatanID:  subkegiatanID,
		Nama:           nama,
		OriginalName:   file.OriginalFilename,
		MimeType:       file.MimeType,
		Size:           file.FileSize,
		URL:            file.StorageKey,
		IsDokumenDSSD:  parseDocumentBoolForm(c.FormValue("is_dokumen_dssd")),
	})
	if err != nil {
		deleteManagedStoredFile(c, p.files, file.StorageKey)
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen pelaksanaan gagal disimpan")
	}

	return jsonData(c, http.StatusCreated, document)
}

func (p *PelaksanaanDocumentController) DownloadDocument(c echo.Context) error {
	return p.serveDocument(c, "attachment")
}

func (p *PelaksanaanDocumentController) PreviewDocument(c echo.Context) error {
	return p.serveDocument(c, "inline")
}

func (p *PelaksanaanDocumentController) serveDocument(c echo.Context, disposition string) error {
	tahunAnggaran, err := pelaksanaanDocumentTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := pelaksanaanDocumentID(c)
	if err != nil {
		return err
	}

	document, found, err := p.documents.DocumentByID(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen pelaksanaan gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen pelaksanaan tidak ditemukan")
	}

	return serveManagedStoredFile(
		c,
		p.files,
		document.StorageURL,
		document.MimeType,
		document.StoredFileName,
		documentRequestDisposition(c, disposition),
		false,
	)
}

func (p *PelaksanaanDocumentController) UpdateDocument(c echo.Context) error {
	tahunAnggaran, err := pelaksanaanDocumentTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := pelaksanaanDocumentID(c)
	if err != nil {
		return err
	}

	var request model.UpdatePelaksanaanDocumentPayload
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload dokumen tidak valid")
	}
	request.Nama = strings.TrimSpace(request.Nama)
	if request.Nama == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama dokumen wajib diisi")
	}

	document, found, err := p.documents.Update(c.Request().Context(), tahunAnggaran, id, request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen pelaksanaan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen pelaksanaan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, document)
}

func (p *PelaksanaanDocumentController) DeleteDocument(c echo.Context) error {
	tahunAnggaran, err := pelaksanaanDocumentTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := pelaksanaanDocumentID(c)
	if err != nil {
		return err
	}

	document, found, err := p.documents.Delete(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen pelaksanaan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen pelaksanaan tidak ditemukan")
	}

	deleteManagedStoredFile(c, p.files, document.StorageURL)
	return c.NoContent(http.StatusNoContent)
}

func pelaksanaanDocumentListParams(c echo.Context) (model.PelaksanaanDocumentListParams, error) {
	tahunAnggaran, err := pelaksanaanDocumentTahunAnggaran(c)
	if err != nil {
		return model.PelaksanaanDocumentListParams{}, err
	}

	requestedYear := strings.TrimSpace(c.QueryParam("tahun_anggaran"))
	if requestedYear == "" {
		requestedYear = strings.TrimSpace(c.QueryParam("tahunAnggaran"))
	}
	if requestedYear != "" && requestedYear != tahunAnggaran {
		return model.PelaksanaanDocumentListParams{}, echo.NewHTTPError(http.StatusForbidden, "tahun anggaran tidak sesuai session login")
	}

	return model.PelaksanaanDocumentListParams{
		TahunAnggaran:     tahunAnggaran,
		SumberAplikasi:    documentQueryValue(c, "sumber_aplikasi", "sumberAplikasi", "source_app", "sourceApp"),
		Bidang:            documentQueryValue(c, "bidang"),
		Search:            c.QueryParam("search"),
		SubkegiatanPrefix: documentQueryValue(c, "subkegiatan_prefix", "subkegiatanPrefix"),
		Page:              parsePositiveDocumentQueryInt(c.QueryParam("page"), 1),
		Limit:             parsePositiveDocumentQueryInt(c.QueryParam("limit"), 10),
	}, nil
}

func documentFormValue(c echo.Context, keys ...string) string {
	for _, key := range keys {
		value := strings.TrimSpace(c.FormValue(key))
		if value != "" {
			return value
		}
	}
	return ""
}

func validateArsipSource(value string) error {
	if !allowedArsipSources[strings.ToLower(strings.TrimSpace(value))] {
		return echo.NewHTTPError(http.StatusBadRequest, "sumber aplikasi arsip tidak valid")
	}
	return nil
}

func validateArsipBidang(value string) error {
	if !allowedArsipBidang[strings.ToLower(strings.TrimSpace(value))] {
		return echo.NewHTTPError(http.StatusBadRequest, "bidang arsip tidak valid")
	}
	return nil
}

func defaultBidangForArsipSource(source string) string {
	switch strings.ToLower(strings.TrimSpace(source)) {
	case "sidak":
		return "dukcapil"
	case "arsip_pegawai":
		return "sekretariat"
	default:
		return "pmk"
	}
}

func documentQueryValue(c echo.Context, keys ...string) string {
	for _, key := range keys {
		value := strings.TrimSpace(c.QueryParam(key))
		if value != "" {
			return value
		}
	}
	return ""
}

func pelaksanaanDocumentTahunAnggaran(c echo.Context) (string, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	tahunAnggaran := strings.TrimSpace(claims.TahunAnggaran)
	if !pelaksanaanDocumentTahunAnggaranPattern.MatchString(tahunAnggaran) || !isSupportedTahunAnggaran(tahunAnggaran) {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	return tahunAnggaran, nil
}

func pelaksanaanDocumentID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func parsePositiveDocumentQueryInt(value string, fallback int) int {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func parseOptionalDocumentInt64(value string, message string) (*int64, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" || strings.EqualFold(trimmed, "null") {
		return nil, nil
	}
	id, err := strconv.ParseInt(trimmed, 10, 64)
	if err != nil || id <= 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, message)
	}
	return &id, nil
}

func parseDocumentBoolForm(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "true", "1", "yes", "y", "on":
		return true
	default:
		return false
	}
}

func savePelaksanaanDocumentUpload(
	c echo.Context,
	files *fileasset.Service,
	tahunAnggaran string,
	sumberAplikasi string,
	bidang string,
	uploadedBy int64,
) (model.StoredFileInput, error) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return model.StoredFileInput{}, echo.NewHTTPError(http.StatusBadRequest, "file dokumen wajib diunggah")
	}
	if files == nil {
		return model.StoredFileInput{}, echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}
	category := strings.ToLower(strings.TrimSpace(sumberAplikasi + "-" + bidang))
	category = strings.ReplaceAll(category, "_", "-")
	file, err := files.Save(c.Request().Context(), fileasset.SaveRequest{
		Header:          fileHeader,
		Kind:            fileasset.KindAny,
		Visibility:      model.FileVisibilityPrivate,
		Module:          "arsip",
		RelatedType:     "pelaksanaan_document",
		Category:        "pelaksanaan",
		StorageCategory: category,
		Year:            tahunAnggaran,
		UploadedBy:      &uploadedBy,
	})
	if err != nil {
		return model.StoredFileInput{}, managedUploadHTTPError(err)
	}
	return file, nil
}

func documentContentDisposition(disposition string, fileName string) string {
	safeName := fileasset.SanitizeFilename(fileName)
	asciiName := strings.Map(func(character rune) rune {
		switch {
		case character == '"' || character == '\\':
			return -1
		case character >= 0x20 && character <= 0x7e:
			return character
		default:
			return '_'
		}
	}, safeName)
	if strings.TrimSpace(asciiName) == "" {
		asciiName = "file"
	}
	encodedName := strings.ReplaceAll(url.PathEscape(safeName), "+", "%20")
	return fmt.Sprintf(
		`%s; filename="%s"; filename*=UTF-8''%s`,
		disposition,
		asciiName,
		encodedName,
	)
}

func documentRequestDisposition(c echo.Context, fallback string) string {
	switch strings.ToLower(strings.TrimSpace(c.QueryParam("disposition"))) {
	case "inline":
		return "inline"
	case "attachment":
		return "attachment"
	}
	if strings.TrimSpace(fallback) == "" {
		return "attachment"
	}
	return fallback
}

func documentServeMimeType(mimeType string, originalName string) string {
	trimmed := strings.TrimSpace(mimeType)
	if trimmed != "" && !strings.EqualFold(trimmed, "application/octet-stream") {
		return trimmed
	}
	if inferred := mime.TypeByExtension(strings.ToLower(filepath.Ext(originalName))); inferred != "" {
		return inferred
	}
	return trimmed
}
