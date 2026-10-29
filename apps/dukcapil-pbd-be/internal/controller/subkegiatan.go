package controller

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"dukcapil-pbd-be/internal/subkegiatanexcel"

	"github.com/labstack/echo"
	"github.com/xuri/excelize/v2"
)

type SubkegiatanStore interface {
	List(ctx context.Context) ([]model.Subkegiatan, error)
	ListPage(ctx context.Context, params model.SubkegiatanListParams) (model.SubkegiatanListResponse, error)
	Create(ctx context.Context, payload model.SubkegiatanPayload) (model.Subkegiatan, error)
	Update(ctx context.Context, id int64, payload model.SubkegiatanPayload) (model.Subkegiatan, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
	Import(ctx context.Context, payloads []model.SubkegiatanPayload) error
}

func (s *SubkegiatanController) Update(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}
	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}
	item, found, err := s.subkegiatan.Update(c.Request().Context(), id, payload)
	if errors.Is(err, repository.ErrSubkegiatanAlreadyExists) {
		return echo.NewHTTPError(http.StatusConflict, "subkegiatan pada hierarki tersebut sudah terdaftar")
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data subkegiatan tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, item)
}

func (s *SubkegiatanController) Delete(c echo.Context) error {
	id, err := paramInt64(c, "id")
	if err != nil {
		return err
	}
	found, err := s.subkegiatan.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "data subkegiatan tidak ditemukan")
	}
	return c.NoContent(http.StatusNoContent)
}

type SubkegiatanController struct {
	subkegiatan SubkegiatanStore
	excel       *subkegiatanexcel.Service
}

func NewSubkegiatanController(subkegiatan SubkegiatanStore) *SubkegiatanController {
	return &SubkegiatanController{subkegiatan: subkegiatan, excel: subkegiatanexcel.New(subkegiatan)}
}

func (s *SubkegiatanController) List(c echo.Context) error {
	// Keep the unparameterized response compatible with form lookups and exports.
	if c.QueryParam("page") != "" || c.QueryParam("pageSize") != "" || c.QueryParam("search") != "" {
		page, err := positiveSubkegiatanQueryInt(c, "page", 1, 1_000_000)
		if err != nil {
			return err
		}
		pageSize, err := positiveSubkegiatanQueryInt(c, "pageSize", 10, 100)
		if err != nil {
			return err
		}
		search := strings.TrimSpace(c.QueryParam("search"))
		if len(search) > 200 {
			return echo.NewHTTPError(http.StatusBadRequest, "pencarian subkegiatan terlalu panjang")
		}
		response, err := s.subkegiatan.ListPage(c.Request().Context(), model.SubkegiatanListParams{Search: search, Page: page, PageSize: pageSize})
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal dimuat")
		}
		return jsonData(c, http.StatusOK, response)
	}
	items, err := s.subkegiatan.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal dimuat")
	}
	return jsonData(c, http.StatusOK, items)
}

func positiveSubkegiatanQueryInt(c echo.Context, name string, fallback, maximum int) (int, error) {
	raw := strings.TrimSpace(c.QueryParam(name))
	if raw == "" {
		return fallback, nil
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 || value > maximum {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter "+name+" tidak valid")
	}
	return value, nil
}

func (s *SubkegiatanController) Create(c echo.Context) error {
	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}

	item, err := s.subkegiatan.Create(c.Request().Context(), payload)
	if errors.Is(err, repository.ErrSubkegiatanAlreadyExists) {
		return echo.NewHTTPError(http.StatusConflict, "subkegiatan pada hierarki tersebut sudah terdaftar")
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data subkegiatan gagal disimpan")
	}
	return jsonData(c, http.StatusCreated, item)
}

func (s *SubkegiatanController) Export(c echo.Context) error {
	file, err := s.excel.Export(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data Subkegiatan gagal diexport")
	}
	defer file.Close()
	return sendWorkbook(c, file, fmt.Sprintf("subkegiatan_%s.xlsx", time.Now().Format("2006-01-02")))
}

func (s *SubkegiatanController) ImportTemplate(c echo.Context) error {
	file, err := s.excel.Template()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template import gagal dibuat")
	}
	defer file.Close()
	return sendWorkbook(c, file, "template_import_subkegiatan.xlsx")
}

func (s *SubkegiatanController) ImportPreview(c echo.Context) error {
	data, err := readSubkegiatanWorkbook(c)
	if err != nil {
		return err
	}
	preview, err := s.excel.Preview(c.Request().Context(), data)
	if err != nil {
		return importHTTPError(err)
	}
	return jsonData(c, http.StatusOK, preview)
}

func (s *SubkegiatanController) Import(c echo.Context) error {
	data, err := readSubkegiatanWorkbook(c)
	if err != nil {
		return err
	}
	result, err := s.excel.Import(c.Request().Context(), data)
	if errors.Is(err, repository.ErrSubkegiatanAlreadyExists) {
		return echo.NewHTTPError(http.StatusConflict, "data berubah setelah preview; unduh ulang data dan periksa file")
	}
	if err != nil {
		return importHTTPError(err)
	}
	return jsonData(c, http.StatusCreated, result)
}

func readSubkegiatanWorkbook(c echo.Context) ([]byte, error) {
	header, err := c.FormFile("file")
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file Excel wajib dipilih")
	}
	if strings.ToLower(filepath.Ext(header.Filename)) != ".xlsx" {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file harus berformat .xlsx")
	}
	if header.Size <= 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file Excel tidak boleh kosong")
	}
	if header.Size > subkegiatanexcel.MaxFileSize {
		return nil, echo.NewHTTPError(http.StatusRequestEntityTooLarge, "ukuran file maksimal 5 MB")
	}
	file, err := header.Open()
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file Excel gagal dibaca")
	}
	defer file.Close()
	data, err := subkegiatanexcel.ReadAll(file)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file Excel gagal dibaca")
	}
	return data, nil
}

func importHTTPError(err error) error {
	if errors.Is(err, subkegiatanexcel.ErrInvalidFile) || errors.Is(err, subkegiatanexcel.ErrEmptyFile) || strings.Contains(err.Error(), "baris error") || strings.Contains(err.Error(), "ukuran file") {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return echo.NewHTTPError(http.StatusInternalServerError, "import Subkegiatan gagal")
}

func sendWorkbook(c echo.Context, file interface {
	Write(io.Writer, ...excelize.Options) error
}, filename string) error {
	var output bytes.Buffer
	if err := file.Write(&output); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "file Excel gagal dibuat")
	}
	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=%q", filename))
	return c.Blob(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", output.Bytes())
}

func validateSubkegiatanPayload(payload model.SubkegiatanPayload) error {
	fields := []struct {
		label string
		value string
	}{
		{label: "bidang", value: payload.Bidang},
		{label: "program", value: payload.Program},
		{label: "kegiatan", value: payload.Kegiatan},
		{label: "subkegiatan", value: payload.Subkegiatan},
		{label: "kinerja", value: payload.Kinerja},
		{label: "indikator", value: payload.Indikator},
		{label: "satuan", value: payload.Satuan},
		{label: "definisi operasional", value: payload.DefinisiOperasional},
	}

	for _, field := range fields {
		if strings.TrimSpace(field.value) == "" {
			return echo.NewHTTPError(http.StatusBadRequest, field.label+" wajib diisi")
		}
	}
	return nil
}
