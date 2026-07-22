package controller

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type ArsipPegawaiStore interface {
	List(ctx context.Context, params model.ArsipPegawaiListParams) ([]model.ArsipPegawaiItem, error)
	Detail(ctx context.Context, id int64) (model.ArsipPegawaiItem, bool, error)
	Create(ctx context.Context, payload model.ArsipPegawaiPayload) (model.ArsipPegawaiItem, error)
	Update(ctx context.Context, id int64, payload model.ArsipPegawaiPayload) (model.ArsipPegawaiItem, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
	CreateDocument(ctx context.Context, payload model.ArsipPegawaiDocumentPayload) (model.ArsipPegawaiDocument, error)
	DocumentByID(ctx context.Context, pegawaiID int64, id int64) (model.ArsipPegawaiDocument, bool, error)
	DeleteDocument(ctx context.Context, pegawaiID int64, id int64) (model.ArsipPegawaiDocument, bool, error)
}

type ArsipPegawaiController struct {
	pegawai ArsipPegawaiStore
}

func NewArsipPegawaiController(pegawai ArsipPegawaiStore) *ArsipPegawaiController {
	return &ArsipPegawaiController{pegawai: pegawai}
}

func (a *ArsipPegawaiController) List(c echo.Context) error {
	records, err := a.pegawai.List(c.Request().Context(), model.ArsipPegawaiListParams{
		Search: c.QueryParam("search"),
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data arsip pegawai gagal dimuat")
	}
	return jsonData(c, http.StatusOK, records)
}

func (a *ArsipPegawaiController) Detail(c echo.Context) error {
	id, err := arsipPegawaiID(c)
	if err != nil {
		return err
	}

	record, found, err := a.pegawai.Detail(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "detail arsip pegawai gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data pegawai tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, record)
}

func (a *ArsipPegawaiController) Create(c echo.Context) error {
	var request model.ArsipPegawaiPayload
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload pegawai tidak valid")
	}
	if err := validateArsipPegawaiPayload(&request); err != nil {
		return err
	}

	record, err := a.pegawai.Create(c.Request().Context(), request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data pegawai gagal disimpan")
	}
	return jsonData(c, http.StatusCreated, record)
}

func (a *ArsipPegawaiController) Update(c echo.Context) error {
	id, err := arsipPegawaiID(c)
	if err != nil {
		return err
	}

	var request model.ArsipPegawaiPayload
	if err := c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload pegawai tidak valid")
	}
	if err := validateArsipPegawaiPayload(&request); err != nil {
		return err
	}

	record, found, err := a.pegawai.Update(c.Request().Context(), id, request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data pegawai gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data pegawai tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, record)
}

func (a *ArsipPegawaiController) Delete(c echo.Context) error {
	id, err := arsipPegawaiID(c)
	if err != nil {
		return err
	}

	record, found, err := a.pegawai.Detail(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data pegawai gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data pegawai tidak ditemukan")
	}

	deleted, err := a.pegawai.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data pegawai gagal dihapus")
	}
	if !deleted {
		return echo.NewHTTPError(http.StatusNotFound, "data pegawai tidak ditemukan")
	}

	for _, document := range record.Documents {
		deletePelaksanaanDocumentStoredFile(c, document.StorageURL)
	}
	return c.NoContent(http.StatusNoContent)
}

func (a *ArsipPegawaiController) UploadDocument(c echo.Context) error {
	tahunAnggaran, err := pelaksanaanDocumentTahunAnggaran(c)
	if err != nil {
		return err
	}
	pegawaiID, err := arsipPegawaiID(c)
	if err != nil {
		return err
	}
	if _, found, err := a.pegawai.Detail(c.Request().Context(), pegawaiID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data pegawai gagal dimuat")
	} else if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data pegawai tidak ditemukan")
	}

	bidang := strings.ToLower(strings.TrimSpace(c.FormValue("bidang")))
	if bidang == "" {
		bidang = "sekretariat"
	}
	if err := validateArsipBidang(bidang); err != nil {
		return err
	}

	file, err := saveArsipPegawaiDocumentUpload(c, tahunAnggaran, bidang, pegawaiID)
	if err != nil {
		return err
	}

	title := strings.TrimSpace(c.FormValue("title"))
	if title == "" {
		title = strings.TrimSpace(c.FormValue("nama"))
	}
	if title == "" {
		title = file.OriginalName
	}

	payload := model.ArsipPegawaiDocumentPayload{
		PegawaiID:     pegawaiID,
		TahunAnggaran: tahunAnggaran,
		Bidang:        bidang,
		Title:         title,
		Category:      strings.TrimSpace(c.FormValue("category")),
		Number:        strings.TrimSpace(c.FormValue("number")),
		Year:          strings.TrimSpace(c.FormValue("year")),
		Status:        strings.TrimSpace(c.FormValue("status")),
		OriginalName:  file.OriginalName,
		MimeType:      file.MimeType,
		Size:          file.Size,
		URL:           file.URL,
	}
	if payload.Category == "" {
		payload.Category = string(model.ArsipPegawaiDocumentLainnya)
	}
	if payload.Status == "" {
		payload.Status = "Lengkap"
	}

	document, err := a.pegawai.CreateDocument(c.Request().Context(), payload)
	if err != nil {
		deletePelaksanaanDocumentStoredFile(c, file.URL)
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen arsip pegawai gagal disimpan")
	}
	return jsonData(c, http.StatusCreated, document)
}

func (a *ArsipPegawaiController) DownloadDocument(c echo.Context) error {
	pegawaiID, err := arsipPegawaiID(c)
	if err != nil {
		return err
	}
	documentID, err := arsipPegawaiDocumentID(c)
	if err != nil {
		return err
	}

	document, found, err := a.pegawai.DocumentByID(c.Request().Context(), pegawaiID, documentID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen arsip pegawai gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen arsip pegawai tidak ditemukan")
	}

	filePath, err := pelaksanaanDocumentStoragePath(document.StorageURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "file dokumen tidak ditemukan")
	}
	if _, err := os.Stat(filePath); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "file dokumen tidak ditemukan")
	}

	c.Response().Header().Set(echo.HeaderContentDisposition, documentContentDisposition("attachment", document.Title))
	if document.MimeType != "" {
		c.Response().Header().Set(echo.HeaderContentType, document.MimeType)
	}

	http.ServeFile(c.Response(), c.Request(), filePath)
	return nil
}

func (a *ArsipPegawaiController) DeleteDocument(c echo.Context) error {
	pegawaiID, err := arsipPegawaiID(c)
	if err != nil {
		return err
	}
	documentID, err := arsipPegawaiDocumentID(c)
	if err != nil {
		return err
	}

	document, found, err := a.pegawai.DeleteDocument(c.Request().Context(), pegawaiID, documentID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen arsip pegawai gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "dokumen arsip pegawai tidak ditemukan")
	}

	deletePelaksanaanDocumentStoredFile(c, document.StorageURL)
	return c.NoContent(http.StatusNoContent)
}

func validateArsipPegawaiPayload(request *model.ArsipPegawaiPayload) error {
	request.NIP = strings.TrimSpace(request.NIP)
	request.NIK = strings.TrimSpace(request.NIK)
	request.Name = strings.TrimSpace(request.Name)
	request.Position = strings.TrimSpace(request.Position)
	request.Unit = strings.TrimSpace(request.Unit)
	request.Rank = strings.TrimSpace(request.Rank)
	request.Email = strings.TrimSpace(request.Email)
	request.Phone = strings.TrimSpace(request.Phone)
	request.BankAccount = strings.TrimSpace(request.BankAccount)
	request.Address = strings.TrimSpace(request.Address)
	request.Status = strings.TrimSpace(request.Status)
	request.PhotoColor = strings.TrimSpace(request.PhotoColor)

	if request.NIP == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "NIP wajib diisi")
	}
	if request.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama pegawai wajib diisi")
	}
	switch request.Status {
	case "", "Aktif", "Cuti", "Mutasi":
		if request.Status == "" {
			request.Status = "Aktif"
		}
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "status pegawai tidak valid")
	}
	return nil
}

func saveArsipPegawaiDocumentUpload(c echo.Context, tahunAnggaran string, bidang string, pegawaiID int64) (model.PelaksanaanDocumentPayload, error) {
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

	baseDir := filepath.Join(
		"uploads",
		"arsip",
		strings.TrimSpace(tahunAnggaran),
		"arsip_pegawai",
		strings.ToLower(strings.TrimSpace(bidang)),
		strconv.FormatInt(pegawaiID, 10),
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

func arsipPegawaiID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter pegawai tidak valid")
	}
	return id, nil
}

func arsipPegawaiDocumentID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("document_id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter dokumen tidak valid")
	}
	return id, nil
}
