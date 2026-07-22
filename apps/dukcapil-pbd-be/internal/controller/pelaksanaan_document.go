package controller

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

const maxPelaksanaanDocumentUploadSize = 15 << 20

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
}

func NewPelaksanaanDocumentController(documents PelaksanaanDocumentStore) *PelaksanaanDocumentController {
	return &PelaksanaanDocumentController{documents: documents}
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
	file, err := savePelaksanaanDocumentUpload(c, tahunAnggaran, sumberAplikasi, bidang, subkegiatanID)
	if err != nil {
		return err
	}

	nama := strings.TrimSpace(c.FormValue("nama"))
	if nama == "" {
		nama = strings.TrimSpace(c.FormValue("nama_dokumen"))
	}
	if nama == "" {
		nama = file.OriginalName
	}

	document, err := p.documents.Create(c.Request().Context(), tahunAnggaran, model.PelaksanaanDocumentPayload{
		SumberAplikasi: sumberAplikasi,
		Bidang:         bidang,
		SubkegiatanID:  subkegiatanID,
		Nama:           nama,
		OriginalName:   file.OriginalName,
		MimeType:       file.MimeType,
		Size:           file.Size,
		URL:            file.URL,
		IsDokumenDSSD:  parseDocumentBoolForm(c.FormValue("is_dokumen_dssd")),
	})
	if err != nil {
		deletePelaksanaanDocumentStoredFile(c, file.URL)
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen pelaksanaan gagal disimpan")
	}

	return jsonData(c, http.StatusCreated, document)
}

func (p *PelaksanaanDocumentController) DownloadDocument(c echo.Context) error {
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

	filePath, err := pelaksanaanDocumentStoragePath(document.StorageURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "file dokumen tidak ditemukan")
	}
	if _, err := os.Stat(filePath); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "file dokumen tidak ditemukan")
	}

	c.Response().Header().Set(echo.HeaderContentDisposition, documentContentDisposition("attachment", document.Nama))
	if document.MimeType != "" {
		c.Response().Header().Set(echo.HeaderContentType, document.MimeType)
	}

	http.ServeFile(c.Response(), c.Request(), filePath)
	return nil
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

	deletePelaksanaanDocumentStoredFile(c, document.StorageURL)
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
	if !pelaksanaanDocumentTahunAnggaranPattern.MatchString(tahunAnggaran) {
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

func savePelaksanaanDocumentUpload(c echo.Context, tahunAnggaran string, sumberAplikasi string, bidang string, subkegiatanID *int64) (model.PelaksanaanDocumentPayload, error) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return model.PelaksanaanDocumentPayload{}, echo.NewHTTPError(http.StatusBadRequest, "file dokumen wajib diupload")
	}
	if fileHeader.Size > maxPelaksanaanDocumentUploadSize {
		return model.PelaksanaanDocumentPayload{}, echo.NewHTTPError(http.StatusBadRequest, "ukuran file maksimal 15MB")
	}
	if err := validatePelaksanaanDocumentUploadType(fileHeader); err != nil {
		return model.PelaksanaanDocumentPayload{}, err
	}

	owner := "umum"
	if subkegiatanID != nil {
		owner = strconv.FormatInt(*subkegiatanID, 10)
	}
	baseDir := filepath.Join(
		"uploads",
		"arsip",
		strings.TrimSpace(tahunAnggaran),
		strings.ToLower(strings.TrimSpace(sumberAplikasi)),
		strings.ToLower(strings.TrimSpace(bidang)),
		owner,
	)
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return model.PelaksanaanDocumentPayload{}, echo.NewHTTPError(http.StatusInternalServerError, "folder upload gagal dibuat")
	}

	extension := strings.ToLower(filepath.Ext(fileHeader.Filename))
	fileName := fmt.Sprintf("%s%s", randomDocumentHex(16), extension)
	targetPath := filepath.Join(baseDir, fileName)
	if err := copyUploadedDocumentFile(fileHeader, targetPath); err != nil {
		return model.PelaksanaanDocumentPayload{}, echo.NewHTTPError(http.StatusInternalServerError, "file gagal disimpan")
	}

	return model.PelaksanaanDocumentPayload{
		OriginalName: fileHeader.Filename,
		MimeType:     fileHeader.Header.Get("Content-Type"),
		Size:         fileHeader.Size,
		URL:          "/" + filepath.ToSlash(targetPath),
	}, nil
}

func validatePelaksanaanDocumentUploadType(header *multipart.FileHeader) error {
	contentType := strings.ToLower(header.Header.Get("Content-Type"))
	extension := strings.ToLower(filepath.Ext(header.Filename))
	allowedExtensions := map[string]bool{
		".pdf":  true,
		".doc":  true,
		".docx": true,
		".xls":  true,
		".xlsx": true,
		".png":  true,
		".jpg":  true,
		".jpeg": true,
	}
	allowedMimeTypes := map[string]bool{
		"application/pdf":    true,
		"application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"application/vnd.ms-excel": true,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
		"image/png":                true,
		"image/jpeg":               true,
		"application/octet-stream": true,
	}
	if !allowedExtensions[extension] || (contentType != "" && !allowedMimeTypes[contentType]) {
		return echo.NewHTTPError(http.StatusBadRequest, "format file tidak didukung")
	}
	return nil
}

func pelaksanaanDocumentStoragePath(storageURL string) (string, error) {
	normalized := strings.TrimPrefix(strings.TrimSpace(storageURL), "/")
	if normalized == "" {
		return "", fmt.Errorf("storage path is empty")
	}
	cleanPath := filepath.Clean(normalized)
	cleanSlashPath := filepath.ToSlash(cleanPath)
	if !allowedPelaksanaanDocumentStoragePrefix(cleanSlashPath) {
		return "", fmt.Errorf("storage path is outside uploads")
	}

	uploadsRoot, err := filepath.Abs("uploads")
	if err != nil {
		return "", err
	}
	targetPath, err := filepath.Abs(cleanPath)
	if err != nil {
		return "", err
	}
	if targetPath != uploadsRoot && !strings.HasPrefix(targetPath, uploadsRoot+string(os.PathSeparator)) {
		return "", fmt.Errorf("storage path is outside uploads")
	}

	return targetPath, nil
}

func allowedPelaksanaanDocumentStoragePrefix(cleanSlashPath string) bool {
	allowedPrefixes := []string{
		"uploads/pelaksanaan-documents/",
		"uploads/arsip/",
		"uploads/realisasi-subkegiatan/",
	}
	for _, prefix := range allowedPrefixes {
		if strings.HasPrefix(cleanSlashPath, prefix) {
			return true
		}
	}
	return false
}

func deletePelaksanaanDocumentStoredFile(c echo.Context, storageURL string) {
	filePath, err := pelaksanaanDocumentStoragePath(storageURL)
	if err != nil {
		c.Logger().Warnf("skip delete document upload %q: %v", storageURL, err)
		return
	}
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		c.Logger().Warnf("delete document upload %q failed: %v", filePath, err)
	}
}

func documentContentDisposition(disposition string, fileName string) string {
	safeName := strings.ReplaceAll(filepath.Base(fileName), `"`, "")
	if safeName == "." || safeName == string(os.PathSeparator) || safeName == "" {
		safeName = "dokumen"
	}
	return fmt.Sprintf(`%s; filename="%s"`, disposition, safeName)
}

func copyUploadedDocumentFile(header *multipart.FileHeader, targetPath string) error {
	source, err := header.Open()
	if err != nil {
		return err
	}
	defer source.Close()

	target, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer target.Close()

	_, err = io.Copy(target, source)
	return err
}

func randomDocumentHex(size int) string {
	buffer := make([]byte, size)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("%d", os.Getpid())
	}
	return hex.EncodeToString(buffer)
}
