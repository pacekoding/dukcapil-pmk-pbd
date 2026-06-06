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

const maxRealisasiUploadSize = 15 << 20

var realisasiTahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)

type RealisasiSubkegiatanStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.RealisasiSubkegiatanListResponse, error)
	Detail(ctx context.Context, tahunAnggaran string, id int64) (model.RealisasiSubkegiatanItem, bool, error)
	Create(ctx context.Context, tahunAnggaran string, payload model.RealisasiSubkegiatanPayload) (model.RealisasiSubkegiatanItem, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.RealisasiSubkegiatanPayload) (model.RealisasiSubkegiatanItem, bool, error)
	Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error)
	AddFoto(ctx context.Context, tahunAnggaran string, realisasiID int64, files []model.RealisasiFile) (model.RealisasiSubkegiatanItem, bool, error)
	AddDokumen(ctx context.Context, tahunAnggaran string, realisasiID int64, files []model.RealisasiFile) (model.RealisasiSubkegiatanItem, bool, error)
}

type RealisasiSubkegiatanController struct {
	realisasi RealisasiSubkegiatanStore
}

func NewRealisasiSubkegiatanController(realisasi RealisasiSubkegiatanStore) *RealisasiSubkegiatanController {
	return &RealisasiSubkegiatanController{realisasi: realisasi}
}

func (r *RealisasiSubkegiatanController) List(c echo.Context) error {
	tahunAnggaran, err := realisasiTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := r.realisasi.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "realisasi subkegiatan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (r *RealisasiSubkegiatanController) Detail(c echo.Context) error {
	tahunAnggaran, id, err := realisasiRequestScope(c)
	if err != nil {
		return err
	}

	item, found, err := r.realisasi.Detail(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "detail realisasi subkegiatan gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "realisasi subkegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (r *RealisasiSubkegiatanController) Create(c echo.Context) error {
	tahunAnggaran, err := realisasiTahunAnggaran(c)
	if err != nil {
		return err
	}

	var payload model.RealisasiSubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload realisasi subkegiatan tidak valid")
	}
	if err := validateRealisasiPayload(payload); err != nil {
		return err
	}

	item, err := r.realisasi.Create(c.Request().Context(), tahunAnggaran, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "realisasi subkegiatan gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (r *RealisasiSubkegiatanController) Update(c echo.Context) error {
	tahunAnggaran, id, err := realisasiRequestScope(c)
	if err != nil {
		return err
	}

	var payload model.RealisasiSubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload realisasi subkegiatan tidak valid")
	}
	if err := validateRealisasiPayload(payload); err != nil {
		return err
	}

	item, found, err := r.realisasi.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "realisasi subkegiatan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "realisasi subkegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (r *RealisasiSubkegiatanController) Delete(c echo.Context) error {
	tahunAnggaran, id, err := realisasiRequestScope(c)
	if err != nil {
		return err
	}

	found, err := r.realisasi.Delete(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "realisasi subkegiatan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "realisasi subkegiatan tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func (r *RealisasiSubkegiatanController) UploadFoto(c echo.Context) error {
	tahunAnggaran, id, err := realisasiRequestScope(c)
	if err != nil {
		return err
	}

	files, err := saveRealisasiUpload(c, id, "foto", true)
	if err != nil {
		return err
	}

	item, found, err := r.realisasi.AddFoto(c.Request().Context(), tahunAnggaran, id, files)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "foto dokumentasi gagal disimpan")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "realisasi subkegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (r *RealisasiSubkegiatanController) UploadDokumen(c echo.Context) error {
	tahunAnggaran, id, err := realisasiRequestScope(c)
	if err != nil {
		return err
	}

	files, err := saveRealisasiUpload(c, id, "dokumen", false)
	if err != nil {
		return err
	}

	item, found, err := r.realisasi.AddDokumen(c.Request().Context(), tahunAnggaran, id, files)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "dokumen realisasi gagal disimpan")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "realisasi subkegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func realisasiRequestScope(c echo.Context) (string, int64, error) {
	tahunAnggaran, err := realisasiTahunAnggaran(c)
	if err != nil {
		return "", 0, err
	}

	id, err := realisasiID(c)
	if err != nil {
		return "", 0, err
	}

	return tahunAnggaran, id, nil
}

func realisasiTahunAnggaran(c echo.Context) (string, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	tahunAnggaran := strings.TrimSpace(claims.TahunAnggaran)
	if !realisasiTahunAnggaranPattern.MatchString(tahunAnggaran) {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	return tahunAnggaran, nil
}

func realisasiID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func validateRealisasiPayload(payload model.RealisasiSubkegiatanPayload) error {
	if payload.SubkegiatanID <= 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "subkegiatan wajib dipilih")
	}
	if strings.TrimSpace(payload.Tanggal) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "tanggal realisasi wajib diisi")
	}
	if strings.TrimSpace(payload.Nama) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama realisasi wajib diisi")
	}

	return nil
}

func saveRealisasiUpload(c echo.Context, realisasiID int64, folder string, imageOnly bool) ([]model.RealisasiFile, error) {
	form, err := c.MultipartForm()
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file upload tidak valid")
	}

	headers := form.File["files"]
	if len(headers) == 0 {
		headers = form.File["file"]
	}
	if len(headers) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file wajib dipilih")
	}

	baseDir := filepath.Join("uploads", "realisasi-subkegiatan", strconv.FormatInt(realisasiID, 10), folder)
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "folder upload gagal dibuat")
	}

	files := make([]model.RealisasiFile, 0, len(headers))
	for _, header := range headers {
		if header.Size > maxRealisasiUploadSize {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "ukuran file maksimal 15MB")
		}
		if err := validateUploadType(header, imageOnly); err != nil {
			return nil, err
		}

		extension := strings.ToLower(filepath.Ext(header.Filename))
		fileName := fmt.Sprintf("%s%s", randomHex(16), extension)
		targetPath := filepath.Join(baseDir, fileName)
		if err := copyUploadedFile(header, targetPath); err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "file gagal disimpan")
		}

		url := "/" + filepath.ToSlash(targetPath)
		files = append(files, model.RealisasiFile{
			FileName:     fileName,
			OriginalName: header.Filename,
			MimeType:     header.Header.Get("Content-Type"),
			Size:         header.Size,
			URL:          url,
		})
	}

	return files, nil
}

func validateUploadType(header *multipart.FileHeader, imageOnly bool) error {
	contentType := strings.ToLower(header.Header.Get("Content-Type"))
	extension := strings.ToLower(filepath.Ext(header.Filename))
	if imageOnly {
		if !strings.HasPrefix(contentType, "image/") {
			return echo.NewHTTPError(http.StatusBadRequest, "foto wajib berupa file gambar")
		}
		return nil
	}

	if contentType != "application/pdf" && extension != ".pdf" {
		return echo.NewHTTPError(http.StatusBadRequest, "dokumen wajib berupa PDF")
	}
	return nil
}

func copyUploadedFile(header *multipart.FileHeader, targetPath string) error {
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

func randomHex(size int) string {
	buffer := make([]byte, size)
	if _, err := rand.Read(buffer); err != nil {
		return strconv.Itoa(os.Getpid())
	}
	return hex.EncodeToString(buffer)
}
