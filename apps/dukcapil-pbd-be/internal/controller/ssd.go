package controller

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
	"github.com/xuri/excelize/v2"
)

type SSDStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.SSDListResponse, error)
	Detail(ctx context.Context, tahunAnggaran string, id int64) (model.SSDDetail, bool, error)
	Create(ctx context.Context, tahunAnggaran string, payload model.SSDPayload) (model.SSDDetail, error)
	Import(ctx context.Context, tahunAnggaran string, payloads []model.SSDPayload) (model.SSDImportResult, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SSDPayload) (model.SSDDetail, bool, error)
	SetStatus(ctx context.Context, tahunAnggaran string, id int64, isActive bool) (model.SSD, bool, error)
}

type SSDController struct {
	ssd SSDStore
}

func NewSSDController(ssd SSDStore) *SSDController {
	return &SSDController{ssd: ssd}
}

func (s *SSDController) List(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := s.ssd.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data ssd gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SSDController) Detail(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := subkegiatanID(c)
	if err != nil {
		return err
	}

	item, found, err := s.ssd.Detail(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "detail ssd gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "ssd tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *SSDController) Create(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	var payload model.SSDPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload ssd tidak valid")
	}
	if err := validateSSDPayload(payload); err != nil {
		return err
	}

	item, err := s.ssd.Create(c.Request().Context(), tahunAnggaran, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "ssd gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *SSDController) Import(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "file xlsx wajib diupload")
	}
	if ext := strings.ToLower(filepath.Ext(fileHeader.Filename)); ext != ".xlsx" {
		return echo.NewHTTPError(http.StatusBadRequest, "file harus berformat .xlsx")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "file xlsx tidak dapat dibuka")
	}
	defer file.Close()

	payloads, err := parseSSDXLSX(file)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := s.ssd.Import(c.Request().Context(), tahunAnggaran, payloads)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "import ssd gagal diproses")
	}

	return jsonData(c, http.StatusOK, result)
}

func (s *SSDController) Template(c echo.Context) error {
	file := excelize.NewFile()
	defer func() {
		_ = file.Close()
	}()

	const sheet = "Template SSD"
	defaultSheet := file.GetSheetName(0)
	if err := file.SetSheetName(defaultSheet, sheet); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}

	headers := []string{"No", "Kode DSSD", "Uraian DSSD", "Satuan", "Definisi Operasional"}
	examples := [][]interface{}{
		{1, "DSSD-001", "Jumlah penduduk yang memiliki KTP-el", "Orang", "Jumlah penduduk wajib KTP yang sudah melakukan perekaman dan memiliki KTP-el."},
		{2, "DSSD-002", "Jumlah penerbitan Kartu Keluarga", "Dokumen", "Jumlah Kartu Keluarga yang diterbitkan selama periode pelaporan."},
	}

	for index, header := range headers {
		cell, err := excelize.CoordinatesToCellName(index+1, 1)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
		}
		if err := file.SetCellValue(sheet, cell, header); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
		}
	}

	for rowIndex, row := range examples {
		for columnIndex, value := range row {
			cell, err := excelize.CoordinatesToCellName(columnIndex+1, rowIndex+2)
			if err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
			}
			if err := file.SetCellValue(sheet, cell, value); err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
			}
		}
	}

	headerStyle, err := file.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"1F3B63"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}
	bodyStyle, err := file.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Vertical: "top", WrapText: true},
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}
	if err := file.SetCellStyle(sheet, "A1", "E1", headerStyle); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}
	if err := file.SetCellStyle(sheet, "A2", "E3", bodyStyle); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}

	widths := map[string]float64{
		"A": 8,
		"B": 18,
		"C": 48,
		"D": 16,
		"E": 64,
	}
	for column, width := range widths {
		if err := file.SetColWidth(sheet, column, column, width); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
		}
	}
	if err := file.SetRowHeight(sheet, 1, 24); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}
	for row := 2; row <= 3; row++ {
		if err := file.SetRowHeight(sheet, row, 44); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
		}
	}
	if err := file.SetPanes(sheet, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      1,
		TopLeftCell: "A2",
		ActivePane:  "bottomLeft",
	}); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}

	var buffer bytes.Buffer
	if err := file.Write(&buffer); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}

	c.Response().Header().Set(echo.HeaderContentDisposition, `attachment; filename="template-upload-ssd.xlsx"`)
	return c.Blob(
		http.StatusOK,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		buffer.Bytes(),
	)
}

func (s *SSDController) Update(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := subkegiatanID(c)
	if err != nil {
		return err
	}

	var payload model.SSDPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload ssd tidak valid")
	}
	if err := validateSSDPayload(payload); err != nil {
		return err
	}

	item, found, err := s.ssd.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "ssd gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "ssd tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *SSDController) SetStatus(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}
	id, err := subkegiatanID(c)
	if err != nil {
		return err
	}

	var payload model.SSDStatusPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload status ssd tidak valid")
	}

	item, found, err := s.ssd.SetStatus(c.Request().Context(), tahunAnggaran, id, payload.IsActive)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "status ssd gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "ssd tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func validateSSDPayload(payload model.SSDPayload) error {
	if strings.TrimSpace(payload.Kode) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kode ssd wajib diisi")
	}
	if strings.TrimSpace(payload.Uraian) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "uraian ssd wajib diisi")
	}
	return nil
}

func parseSSDXLSX(reader io.Reader) ([]model.SSDPayload, error) {
	workbook, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "file xlsx tidak valid")
	}
	defer func() {
		_ = workbook.Close()
	}()

	sheets := workbook.GetSheetList()
	if len(sheets) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "sheet xlsx tidak ditemukan")
	}

	rows, err := workbook.GetRows(sheets[0])
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "sheet xlsx tidak dapat dibaca")
	}
	if len(rows) <= 1 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "data xlsx kosong")
	}

	payloads := make([]model.SSDPayload, 0, len(rows)-1)
	for index, row := range rows[1:] {
		kode := cellValue(row, 1)
		uraian := cellValue(row, 2)
		if strings.TrimSpace(kode) == "" && strings.TrimSpace(uraian) == "" {
			continue
		}
		if strings.TrimSpace(kode) == "" || strings.TrimSpace(uraian) == "" {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "baris "+strconv.Itoa(index+2)+" wajib memiliki kode dan uraian ssd")
		}

		payloads = append(payloads, model.SSDPayload{
			Kode:                kode,
			Uraian:              uraian,
			Satuan:              cellValue(row, 3),
			DefinisiOperasional: cellValue(row, 4),
		})
	}

	if len(payloads) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "data ssd pada xlsx tidak ditemukan")
	}

	return payloads, nil
}

func cellValue(row []string, index int) string {
	if index >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[index])
}
