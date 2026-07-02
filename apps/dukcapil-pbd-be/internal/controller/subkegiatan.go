package controller

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
	"github.com/xuri/excelize/v2"
)

var (
	subkegiatanTahunAnggaranPattern = regexp.MustCompile(`^\d{4}$`)
	subkegiatanKodePattern          = regexp.MustCompile(`^\d+(?:\.\d+)+$`)
)

const maxSubkegiatanKodeLength = 64

type SubkegiatanStore interface {
	List(ctx context.Context, tahunAnggaran string) (model.SubkegiatanListResponse, error)
	Create(ctx context.Context, tahunAnggaran string, payload model.SubkegiatanPayload) (model.Subkegiatan, error)
	Import(ctx context.Context, tahunAnggaran string, payloads []model.SubkegiatanImportPayload) (model.SubkegiatanImportResult, error)
	Update(ctx context.Context, tahunAnggaran string, id int64, payload model.SubkegiatanPayload) (model.Subkegiatan, bool, error)
	Delete(ctx context.Context, tahunAnggaran string, id int64) (bool, error)
}

type SubkegiatanController struct {
	subkegiatan SubkegiatanStore
}

func NewSubkegiatanController(subkegiatan SubkegiatanStore) *SubkegiatanController {
	return &SubkegiatanController{subkegiatan: subkegiatan}
}

func (s *SubkegiatanController) List(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	response, err := s.subkegiatan.List(c.Request().Context(), tahunAnggaran)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (s *SubkegiatanController) Create(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	payload.Bidang = detectSubkegiatanBidang(payload.Kode)
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}

	item, err := s.subkegiatan.Create(c.Request().Context(), tahunAnggaran, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal dibuat")
	}

	return jsonData(c, http.StatusCreated, item)
}

func (s *SubkegiatanController) Import(c echo.Context) error {
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

	payloads, err := parseSubkegiatanXLSX(file)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := s.subkegiatan.Import(c.Request().Context(), tahunAnggaran, payloads)
	if err != nil {
		if strings.Contains(err.Error(), "baris ") {
			return echo.NewHTTPError(http.StatusBadRequest, strings.TrimPrefix(err.Error(), "import subkegiatan: "))
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "import subkegiatan gagal diproses")
	}

	return jsonData(c, http.StatusOK, result)
}

func (s *SubkegiatanController) Template(c echo.Context) error {
	file := excelize.NewFile()
	defer func() {
		_ = file.Close()
	}()

	const sheet = "Template Subkegiatan"
	defaultSheet := file.GetSheetName(0)
	if err := file.SetSheetName(defaultSheet, sheet); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}

	headers := []string{"No", "Kode Subkegiatan", "Nama Subkegiatan", "Kode DSSD Terkait"}
	examples := [][]interface{}{
		{1, "2.12.01.1.01.0001", "Pelayanan pendaftaran penduduk", "DSSD-001, DSSD-002"},
		{2, "2.13.03.4.01.0004", "Koordinasi pelaksanaan kebijakan PMK", "DSSD-001"},
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
	if err := file.SetCellStyle(sheet, "A1", "D1", headerStyle); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}
	if err := file.SetCellStyle(sheet, "A2", "D3", bodyStyle); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
	}
	widths := map[string]float64{
		"A": 8,
		"B": 24,
		"C": 56,
		"D": 36,
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
		if err := file.SetRowHeight(sheet, row, 40); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "template xlsx gagal dibuat")
		}
	}
	if err := file.SetPanes(sheet, &excelize.Panes{
		Freeze:      true,
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

	c.Response().Header().Set(echo.HeaderContentDisposition, `attachment; filename="template-upload-subkegiatan.xlsx"`)
	return c.Blob(
		http.StatusOK,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		buffer.Bytes(),
	)
}

func (s *SubkegiatanController) Update(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	id, err := subkegiatanID(c)
	if err != nil {
		return err
	}

	var payload model.SubkegiatanPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload subkegiatan tidak valid")
	}
	payload.Bidang = detectSubkegiatanBidang(payload.Kode)
	if err := validateSubkegiatanPayload(payload); err != nil {
		return err
	}

	item, found, err := s.subkegiatan.Update(c.Request().Context(), tahunAnggaran, id, payload)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "subkegiatan tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (s *SubkegiatanController) Delete(c echo.Context) error {
	tahunAnggaran, err := subkegiatanTahunAnggaran(c)
	if err != nil {
		return err
	}

	id, err := subkegiatanID(c)
	if err != nil {
		return err
	}

	found, err := s.subkegiatan.Delete(c.Request().Context(), tahunAnggaran, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "subkegiatan gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "subkegiatan tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func subkegiatanTahunAnggaran(c echo.Context) (string, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}

	tahunAnggaran := strings.TrimSpace(claims.TahunAnggaran)
	if !subkegiatanTahunAnggaranPattern.MatchString(tahunAnggaran) {
		return "", echo.NewHTTPError(http.StatusBadRequest, "tahun anggaran tidak valid")
	}

	return tahunAnggaran, nil
}

func subkegiatanID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}

	return id, nil
}

func validateSubkegiatanPayload(payload model.SubkegiatanPayload) error {
	kode := strings.TrimSpace(payload.Kode)
	nama := strings.TrimSpace(payload.Nama)
	if kode == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kode subkegiatan wajib diisi")
	}
	if nama == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama subkegiatan wajib diisi")
	}
	if len(kode) > maxSubkegiatanKodeLength {
		if subkegiatanKodePattern.MatchString(nama) {
			return echo.NewHTTPError(http.StatusBadRequest, "kode dan nama subkegiatan tampak tertukar")
		}
		return echo.NewHTTPError(http.StatusBadRequest, "kode subkegiatan maksimal 64 karakter")
	}
	if !subkegiatanKodePattern.MatchString(kode) {
		if subkegiatanKodePattern.MatchString(nama) {
			return echo.NewHTTPError(http.StatusBadRequest, "kode dan nama subkegiatan tampak tertukar")
		}
		return echo.NewHTTPError(http.StatusBadRequest, "format kode subkegiatan tidak valid")
	}
	if !validSubkegiatanBidang(payload.Bidang) {
		return echo.NewHTTPError(http.StatusBadRequest, "bidang subkegiatan tidak valid")
	}
	for _, ssdID := range payload.SSDIDs {
		if ssdID <= 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "pilihan ssd tidak valid")
		}
	}

	return nil
}

func validSubkegiatanBidang(bidang model.SubkegiatanBidang) bool {
	switch bidang {
	case model.SubkegiatanBidangDukcapil, model.SubkegiatanBidangPMK, model.SubkegiatanBidangUmum:
		return true
	default:
		return false
	}
}

func detectSubkegiatanBidang(kode string) model.SubkegiatanBidang {
	normalized := strings.TrimSpace(kode)
	if strings.HasPrefix(normalized, "2.12.") {
		return model.SubkegiatanBidangDukcapil
	}
	if strings.HasPrefix(normalized, "2.13") {
		return model.SubkegiatanBidangPMK
	}
	return model.SubkegiatanBidangUmum
}

func parseSubkegiatanXLSX(reader io.Reader) ([]model.SubkegiatanImportPayload, error) {
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

	payloads := make([]model.SubkegiatanImportPayload, 0, len(rows)-1)
	seenCodes := map[string]struct{}{}
	for index, row := range rows[1:] {
		rowNumber := index + 2
		kode := cellValue(row, 1)
		nama := cellValue(row, 2)
		ssdCodes := splitSubkegiatanSSDCodes(cellValue(row, 3))
		if strings.TrimSpace(kode) == "" && strings.TrimSpace(nama) == "" && len(ssdCodes) == 0 {
			continue
		}

		if err := validateSubkegiatanPayload(model.SubkegiatanPayload{
			Kode:   kode,
			Nama:   nama,
			Bidang: detectSubkegiatanBidang(kode),
		}); err != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "baris "+strconv.Itoa(rowNumber)+": "+err.Error())
		}

		normalizedCode := strings.ToLower(strings.TrimSpace(kode))
		if _, exists := seenCodes[normalizedCode]; exists {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "baris "+strconv.Itoa(rowNumber)+": kode subkegiatan duplikat")
		}
		seenCodes[normalizedCode] = struct{}{}

		payloads = append(payloads, model.SubkegiatanImportPayload{
			Row:      rowNumber,
			Kode:     kode,
			Nama:     nama,
			Bidang:   detectSubkegiatanBidang(kode),
			SSDCodes: ssdCodes,
		})
	}

	if len(payloads) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "data subkegiatan pada xlsx tidak ditemukan")
	}

	return payloads, nil
}

func splitSubkegiatanSSDCodes(value string) []string {
	parts := strings.FieldsFunc(value, func(r rune) bool {
		return r == ',' || r == ';' || r == '\n' || r == '\r' || r == '\t'
	})
	codes := make([]string, 0, len(parts))
	seen := map[string]struct{}{}
	for _, part := range parts {
		code := strings.TrimSpace(part)
		if code == "" {
			continue
		}
		normalized := strings.ToLower(code)
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		codes = append(codes, code)
	}
	return codes
}
