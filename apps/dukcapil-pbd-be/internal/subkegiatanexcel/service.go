package subkegiatanexcel

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"unicode"

	"dukcapil-pbd-be/internal/model"

	"github.com/xuri/excelize/v2"
)

const MaxFileSize = 5 * 1024 * 1024

var (
	ErrInvalidFile = errors.New("format file tidak sesuai template Subkegiatan")
	ErrEmptyFile   = errors.New("file tidak memiliki data untuk diimport")
)

var headers = []struct{ Label, Field string }{
	{"Bidang", "bidang"}, {"Program", "program"}, {"Kegiatan", "kegiatan"},
	{"Subkegiatan", "subkegiatan"}, {"Kinerja", "kinerja"}, {"Indikator", "indikator"},
	{"Satuan", "satuan"}, {"Definisi Operasional", "definisiOperasional"},
}

type Store interface {
	List(context.Context) ([]model.Subkegiatan, error)
	Import(context.Context, []model.SubkegiatanPayload) error
}

type Service struct{ store Store }

func New(store Store) *Service { return &Service{store: store} }

func (s *Service) Preview(ctx context.Context, data []byte) (model.SubkegiatanImportPreview, error) {
	if len(data) == 0 {
		return model.SubkegiatanImportPreview{}, ErrEmptyFile
	}
	if len(data) > MaxFileSize {
		return model.SubkegiatanImportPreview{}, fmt.Errorf("ukuran file maksimal 5 MB")
	}
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		return model.SubkegiatanImportPreview{}, ErrInvalidFile
	}
	defer f.Close()
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return model.SubkegiatanImportPreview{}, ErrInvalidFile
	}
	rows, err := f.GetRows(sheets[0], excelize.Options{RawCellValue: true})
	if err != nil || len(rows) == 0 {
		return model.SubkegiatanImportPreview{}, ErrInvalidFile
	}
	indexes, err := validateHeaders(rows[0])
	if err != nil {
		return model.SubkegiatanImportPreview{}, err
	}

	existing, err := s.store.List(ctx)
	if err != nil {
		return model.SubkegiatanImportPreview{}, fmt.Errorf("memeriksa data existing: %w", err)
	}
	existingKeys := make(map[string]bool, len(existing))
	for _, item := range existing {
		existingKeys[hierarchyKey(item.Bidang, item.Program, item.Kegiatan, item.Subkegiatan)] = true
	}
	seen := map[string]int{}
	preview := model.SubkegiatanImportPreview{Rows: []model.SubkegiatanImportRow{}}
	for i := 1; i < len(rows); i++ {
		if blankRow(rows[i]) {
			continue
		}
		row := importRow(i+1, rows[i], indexes)
		missing := missingLabel(row)
		key := hierarchyKey(row.Bidang, row.Program, row.Kegiatan, row.Subkegiatan)
		switch {
		case missing != "":
			row.Status, row.Message = "error", fmt.Sprintf("Baris %d: %s wajib diisi.", row.Row, missing)
		case seen[key] > 0:
			row.Status, row.Message = "error", fmt.Sprintf("Baris %d: hierarki Subkegiatan muncul lebih dari satu kali (pertama di baris %d).", row.Row, seen[key])
		case existingKeys[key]:
			row.Status, row.Message = "existing", "Existing — akan dilewati"
		default:
			row.Status, row.Message = "valid", "Data baru"
		}
		if key != "|||" && seen[key] == 0 {
			seen[key] = row.Row
		}
		preview.Rows = append(preview.Rows, row)
	}
	if len(preview.Rows) == 0 {
		return model.SubkegiatanImportPreview{}, ErrEmptyFile
	}
	// If a later duplicate exists, the first occurrence is also invalid so the file must be corrected.
	counts := map[string]int{}
	for _, row := range preview.Rows {
		counts[hierarchyKey(row.Bidang, row.Program, row.Kegiatan, row.Subkegiatan)]++
	}
	for i := range preview.Rows {
		row := &preview.Rows[i]
		key := hierarchyKey(row.Bidang, row.Program, row.Kegiatan, row.Subkegiatan)
		if key != "|||" && counts[key] > 1 && row.Status != "error" {
			row.Status, row.Message = "error", fmt.Sprintf("Baris %d: hierarki Subkegiatan muncul lebih dari satu kali dalam file.", row.Row)
		}
		switch row.Status {
		case "valid":
			preview.ValidRows++
		case "existing":
			preview.ExistingRows++
		default:
			preview.ErrorRows++
		}
	}
	preview.TotalRows = len(preview.Rows)
	return preview, nil
}

func (s *Service) Import(ctx context.Context, data []byte) (model.SubkegiatanImportResult, error) {
	preview, err := s.Preview(ctx, data)
	if err != nil {
		return model.SubkegiatanImportResult{}, err
	}
	if preview.ErrorRows > 0 {
		return model.SubkegiatanImportResult{}, fmt.Errorf("file memiliki %d baris error; perbaiki file sebelum import", preview.ErrorRows)
	}
	payloads := make([]model.SubkegiatanPayload, 0, preview.ValidRows)
	for _, row := range preview.Rows {
		if row.Status == "valid" {
			payloads = append(payloads, row.Payload())
		}
	}
	if err := s.store.Import(ctx, payloads); err != nil {
		return model.SubkegiatanImportResult{}, err
	}
	return model.SubkegiatanImportResult{ImportedRows: len(payloads), SkippedRows: preview.ExistingRows}, nil
}

func (s *Service) Export(ctx context.Context) (*excelize.File, error) {
	items, err := s.store.List(ctx)
	if err != nil {
		return nil, err
	}
	rows := make([][]string, 0, len(items))
	for _, v := range items {
		rows = append(rows, []string{v.Bidang, v.Program, v.Kegiatan, v.Subkegiatan, v.Kinerja, v.Indikator, v.Satuan, v.DefinisiOperasional})
	}
	return workbook(rows, true)
}

func (s *Service) Template() (*excelize.File, error) {
	example := []string{"2.13 Urusan Pemberdayaan Masyarakat dan Desa", "2.13.05 Program Penataan Desa", "Kegiatan Penataan Desa", "2.13.05.1.01.0006 Pemanfaatan Teknologi Tepat Guna", "Meningkatnya pemanfaatan teknologi tepat guna", "Jumlah kegiatan yang difasilitasi", "Kegiatan", "Data contoh; hapus atau ganti sebelum import."}
	return workbook([][]string{example}, false)
}

func workbook(data [][]string, numbered bool) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "Subkegiatan"
	f.SetSheetName("Sheet1", sheet)
	labels := make([]string, 0, len(headers)+1)
	if numbered {
		labels = append(labels, "No")
	}
	for _, h := range headers {
		labels = append(labels, h.Label)
	}
	for col, label := range labels {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheet, cell, label)
	}
	for i, row := range data {
		values := row
		if numbered {
			values = append([]string{fmt.Sprint(i + 1)}, row...)
		}
		for col, value := range values {
			cell, _ := excelize.CoordinatesToCellName(col+1, i+2)
			f.SetCellStr(sheet, cell, value)
		}
	}
	headerStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Color: "FFFFFF"}, Fill: excelize.Fill{Type: "pattern", Color: []string{"1E3A5F"}, Pattern: 1}, Alignment: &excelize.Alignment{Vertical: "center"}})
	wrapStyle, _ := f.NewStyle(&excelize.Style{Alignment: &excelize.Alignment{Vertical: "top", WrapText: true}})
	textStyle, _ := f.NewStyle(&excelize.Style{NumFmt: 49, Alignment: &excelize.Alignment{Vertical: "top", WrapText: true}})
	lastCol, _ := excelize.ColumnNumberToName(len(labels))
	f.SetCellStyle(sheet, "A1", lastCol+"1", headerStyle)
	f.SetRowHeight(sheet, 1, 24)
	if len(data) > 0 {
		f.SetCellStyle(sheet, "A2", lastCol+fmt.Sprint(len(data)+1), wrapStyle)
		start := 1
		if numbered {
			start = 2
		}
		startCol, _ := excelize.ColumnNumberToName(start)
		f.SetCellStyle(sheet, startCol+"2", lastCol+fmt.Sprint(len(data)+1), textStyle)
	}
	f.SetPanes(sheet, &excelize.Panes{Freeze: true, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})
	f.AutoFilter(sheet, "A1:"+lastCol+"1", nil)
	widths := []float64{8, 28, 34, 34, 42, 36, 36, 16, 46}
	for i := 0; i < len(labels); i++ {
		col, _ := excelize.ColumnNumberToName(i + 1)
		width := widths[i]
		if !numbered {
			width = widths[i+1]
		}
		f.SetColWidth(sheet, col, col, width)
	}
	return f, nil
}

func validateHeaders(row []string) (map[string]int, error) {
	available := map[string]int{}
	for i, v := range row {
		available[normalize(v)] = i
	}
	result := map[string]int{}
	for _, h := range headers {
		idx, ok := available[normalize(h.Label)]
		if !ok {
			return nil, fmt.Errorf("%w. Kolom %q tidak ditemukan.", ErrInvalidFile, h.Label)
		}
		result[h.Field] = idx
	}
	return result, nil
}
func importRow(n int, row []string, index map[string]int) model.SubkegiatanImportRow {
	get := func(k string) string {
		i := index[k]
		if i >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[i])
	}
	return model.SubkegiatanImportRow{Row: n, Bidang: get("bidang"), Program: get("program"), Kegiatan: get("kegiatan"), Subkegiatan: get("subkegiatan"), Kinerja: get("kinerja"), Indikator: get("indikator"), Satuan: get("satuan"), DefinisiOperasional: get("definisiOperasional")}
}
func missingLabel(r model.SubkegiatanImportRow) string {
	fields := []struct{ l, v string }{{"Bidang", r.Bidang}, {"Program", r.Program}, {"Kegiatan", r.Kegiatan}, {"Subkegiatan", r.Subkegiatan}, {"Kinerja", r.Kinerja}, {"Indikator", r.Indikator}, {"Satuan", r.Satuan}, {"Definisi Operasional", r.DefinisiOperasional}}
	for _, f := range fields {
		if f.v == "" {
			return f.l
		}
	}
	return ""
}
func hierarchyKey(v ...string) string {
	for i := range v {
		v[i] = normalize(v[i])
	}
	return strings.Join(v, "|")
}
func normalize(v string) string {
	return strings.ToLower(strings.Join(strings.FieldsFunc(strings.TrimSpace(v), unicode.IsSpace), " "))
}
func blankRow(row []string) bool {
	for _, v := range row {
		if strings.TrimSpace(v) != "" {
			return false
		}
	}
	return true
}
func ReadAll(r io.Reader) ([]byte, error) { return io.ReadAll(io.LimitReader(r, MaxFileSize+1)) }
