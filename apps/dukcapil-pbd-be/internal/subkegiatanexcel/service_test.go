package subkegiatanexcel

import (
	"bytes"
	"context"
	"errors"
	"testing"

	"dukcapil-pbd-be/internal/model"

	"github.com/xuri/excelize/v2"
)

type fakeStore struct {
	items    []model.Subkegiatan
	imported []model.SubkegiatanPayload
	err      error
}

func (f *fakeStore) List(context.Context) ([]model.Subkegiatan, error) { return f.items, nil }
func (f *fakeStore) Import(_ context.Context, rows []model.SubkegiatanPayload) error {
	if f.err != nil {
		return f.err
	}
	f.imported = append(f.imported, rows...)
	return nil
}

func TestPreviewValidAndExisting(t *testing.T) {
	existing := payload("A", "Existing")
	store := &fakeStore{items: []model.Subkegiatan{{ID: 1, Bidang: existing.Bidang, Program: existing.Program, Kegiatan: existing.Kegiatan, Subkegiatan: existing.Subkegiatan}}}
	preview, err := New(store).Preview(context.Background(), excelBytes(t, []model.SubkegiatanPayload{existing, payload("B", "Baru")}))
	if err != nil {
		t.Fatal(err)
	}
	if preview.TotalRows != 2 || preview.ExistingRows != 1 || preview.ValidRows != 1 || preview.ErrorRows != 0 {
		t.Fatalf("unexpected preview: %+v", preview)
	}
}

func TestPreviewMissingHeader(t *testing.T) {
	f := excelize.NewFile()
	f.SetCellValue("Sheet1", "A1", "Bidang")
	var out bytes.Buffer
	if err := f.Write(&out); err != nil {
		t.Fatal(err)
	}
	_, err := New(&fakeStore{}).Preview(context.Background(), out.Bytes())
	if !errors.Is(err, ErrInvalidFile) {
		t.Fatalf("expected ErrInvalidFile, got %v", err)
	}
}

func TestPreviewDuplicateAndRequiredField(t *testing.T) {
	first := payload("A", "Sama")
	missing := payload("B", "Kosong")
	missing.Indikator = "  "
	preview, err := New(&fakeStore{}).Preview(context.Background(), excelBytes(t, []model.SubkegiatanPayload{first, first, missing}))
	if err != nil {
		t.Fatal(err)
	}
	if preview.ErrorRows != 3 || preview.ValidRows != 0 {
		t.Fatalf("unexpected preview: %+v", preview)
	}
	if preview.Rows[2].Message != "Baris 4: Indikator wajib diisi." {
		t.Fatalf("unexpected message: %s", preview.Rows[2].Message)
	}
}

func TestPreviewEmptyFile(t *testing.T) {
	data := excelBytes(t, nil)
	_, err := New(&fakeStore{}).Preview(context.Background(), data)
	if !errors.Is(err, ErrEmptyFile) {
		t.Fatalf("expected ErrEmptyFile, got %v", err)
	}
}

func TestImportSuccessAndFailure(t *testing.T) {
	data := excelBytes(t, []model.SubkegiatanPayload{payload("A", "Baru")})
	store := &fakeStore{}
	result, err := New(store).Import(context.Background(), data)
	if err != nil || result.ImportedRows != 1 || len(store.imported) != 1 {
		t.Fatalf("unexpected result=%+v err=%v", result, err)
	}

	store = &fakeStore{err: errors.New("transaction rolled back")}
	if _, err := New(store).Import(context.Background(), data); err == nil {
		t.Fatal("expected import failure")
	}
	if len(store.imported) != 0 {
		t.Fatal("failed import must not report persisted rows")
	}
}

func TestExportKeepsTextFormatting(t *testing.T) {
	store := &fakeStore{items: []model.Subkegiatan{{ID: 1, Bidang: "2.13", Program: "02.01", Kegiatan: "1.01", Subkegiatan: "2.13.05.1.01.0006", Kinerja: "K", Indikator: "I", Satuan: "Dokumen", DefinisiOperasional: "D"}}}
	f, err := New(store).Export(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	value, err := f.GetCellValue("Subkegiatan", "E2", excelize.Options{RawCellValue: true})
	if err != nil {
		t.Fatal(err)
	}
	if value != "2.13.05.1.01.0006" {
		t.Fatalf("code changed: %q", value)
	}
	styleID, err := f.GetCellStyle("Subkegiatan", "E2")
	if err != nil {
		t.Fatal(err)
	}
	style, err := f.GetStyle(styleID)
	if err != nil {
		t.Fatal(err)
	}
	if style.NumFmt != 49 {
		t.Fatalf("expected text format, got %d", style.NumFmt)
	}
}

func payload(prefix, sub string) model.SubkegiatanPayload {
	return model.SubkegiatanPayload{Bidang: prefix + " Bidang", Program: prefix + " Program", Kegiatan: prefix + " Kegiatan", Subkegiatan: sub, Kinerja: "Kinerja", Indikator: "Indikator", Satuan: "Dokumen", DefinisiOperasional: "Definisi"}
}

func excelBytes(t *testing.T, rows []model.SubkegiatanPayload) []byte {
	t.Helper()
	f := excelize.NewFile()
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue("Sheet1", cell, h.Label)
	}
	for i, row := range rows {
		values := []string{row.Bidang, row.Program, row.Kegiatan, row.Subkegiatan, row.Kinerja, row.Indikator, row.Satuan, row.DefinisiOperasional}
		for j, value := range values {
			cell, _ := excelize.CoordinatesToCellName(j+1, i+2)
			f.SetCellStr("Sheet1", cell, value)
		}
	}
	var out bytes.Buffer
	if err := f.Write(&out); err != nil {
		t.Fatal(err)
	}
	return out.Bytes()
}
