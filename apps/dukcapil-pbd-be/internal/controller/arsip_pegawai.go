package controller

import (
	"context"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

var arsipPegawaiDocumentYearPattern = regexp.MustCompile(`^\d{4}$`)

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
	files   *fileasset.Service
}

func NewArsipPegawaiController(
	pegawai ArsipPegawaiStore,
	files ...*fileasset.Service,
) *ArsipPegawaiController {
	var service *fileasset.Service
	if len(files) > 0 {
		service = files[0]
	}
	return &ArsipPegawaiController{pegawai: pegawai, files: service}
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
		deleteManagedStoredFile(c, a.files, document.StorageURL)
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

	payload := model.ArsipPegawaiDocumentPayload{
		PegawaiID:     pegawaiID,
		TahunAnggaran: tahunAnggaran,
		Bidang:        bidang,
		Title:         strings.TrimSpace(c.FormValue("title")),
		Category:      strings.TrimSpace(c.FormValue("category")),
		Number:        strings.TrimSpace(c.FormValue("number")),
		Year:          strings.TrimSpace(c.FormValue("year")),
		Status:        strings.TrimSpace(c.FormValue("status")),
	}
	if payload.Title == "" {
		payload.Title = strings.TrimSpace(c.FormValue("nama"))
	}
	if err := validateArsipPegawaiDocumentPayload(&payload); err != nil {
		return err
	}

	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}
	file, err := saveArsipPegawaiDocumentUpload(c, a.files, tahunAnggaran, bidang, claims.UserID)
	if err != nil {
		return err
	}

	if payload.Title == "" {
		payload.Title = file.OriginalFilename
	}

	payload.File = &file
	payload.OriginalName = file.OriginalFilename
	payload.MimeType = file.MimeType
	payload.Size = file.FileSize
	payload.URL = file.StorageKey

	document, err := a.pegawai.CreateDocument(c.Request().Context(), payload)
	if err != nil {
		deleteManagedStoredFile(c, a.files, file.StorageKey)
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen arsip pegawai gagal disimpan")
	}
	return jsonData(c, http.StatusCreated, document)
}

func (a *ArsipPegawaiController) DownloadDocument(c echo.Context) error {
	return a.serveDocument(c, "attachment")
}

func (a *ArsipPegawaiController) PreviewDocument(c echo.Context) error {
	return a.serveDocument(c, "inline")
}

func (a *ArsipPegawaiController) serveDocument(c echo.Context, disposition string) error {
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

	return serveManagedStoredFile(
		c,
		a.files,
		document.StorageURL,
		document.MimeType,
		document.StoredFileName,
		documentRequestDisposition(c, disposition),
		false,
	)
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

	deleteManagedStoredFile(c, a.files, document.StorageURL)
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

func validateArsipPegawaiDocumentPayload(payload *model.ArsipPegawaiDocumentPayload) error {
	if payload.Category == "" {
		payload.Category = string(model.ArsipPegawaiDocumentLainnya)
	}
	switch model.ArsipPegawaiDocumentCategory(payload.Category) {
	case model.ArsipPegawaiDocumentIjazah,
		model.ArsipPegawaiDocumentSK,
		model.ArsipPegawaiDocumentSPMT,
		model.ArsipPegawaiDocumentSertifikat,
		model.ArsipPegawaiDocumentLainnya:
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "kategori dokumen tidak valid")
	}

	if payload.Year != "" && !arsipPegawaiDocumentYearPattern.MatchString(payload.Year) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun dokumen tidak valid")
	}
	if payload.Status == "" {
		payload.Status = "Lengkap"
	}
	switch payload.Status {
	case "Lengkap", "Perlu Verifikasi":
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "status dokumen tidak valid")
	}
	return nil
}

func saveArsipPegawaiDocumentUpload(
	c echo.Context,
	files *fileasset.Service,
	tahunAnggaran string,
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
	category := strings.ToLower(strings.TrimSpace("pegawai-" + bidang))
	category = strings.ReplaceAll(category, "_", "-")
	file, err := files.Save(c.Request().Context(), fileasset.SaveRequest{
		Header:          fileHeader,
		Kind:            fileasset.KindAny,
		Visibility:      model.FileVisibilityPrivate,
		Module:          "arsip",
		RelatedType:     "arsip_pegawai_document",
		Category:        "arsip-pegawai",
		StorageCategory: category,
		Year:            tahunAnggaran,
		UploadedBy:      &uploadedBy,
	})
	if err != nil {
		return model.StoredFileInput{}, managedUploadHTTPError(err)
	}
	return file, nil
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
