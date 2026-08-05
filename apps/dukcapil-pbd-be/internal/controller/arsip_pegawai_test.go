package controller

import (
	"net/http"
	"testing"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

func TestValidateArsipPegawaiDocumentPayload(t *testing.T) {
	payload := model.ArsipPegawaiDocumentPayload{}
	if err := validateArsipPegawaiDocumentPayload(&payload); err != nil {
		t.Fatalf("validateArsipPegawaiDocumentPayload() error = %v", err)
	}
	if payload.Category != string(model.ArsipPegawaiDocumentLainnya) {
		t.Fatalf("Category = %q", payload.Category)
	}
	if payload.Status != "Lengkap" {
		t.Fatalf("Status = %q", payload.Status)
	}
}

func TestValidateArsipPegawaiDocumentPayloadRejectsInvalidMetadata(t *testing.T) {
	tests := []model.ArsipPegawaiDocumentPayload{
		{Category: "Rahasia"},
		{Category: string(model.ArsipPegawaiDocumentSK), Year: "26"},
		{Category: string(model.ArsipPegawaiDocumentSK), Year: "2026", Status: "Rusak"},
	}

	for _, payload := range tests {
		err := validateArsipPegawaiDocumentPayload(&payload)
		httpError, ok := err.(*echo.HTTPError)
		if !ok || httpError.Code != http.StatusBadRequest {
			t.Fatalf("payload %+v error = %v, want HTTP 400", payload, err)
		}
	}
}

func TestValidateArsipPegawaiDocumentMetadataPayload(t *testing.T) {
	payload := model.ArsipPegawaiDocumentMetadataPayload{
		Bidang:   " PMK ",
		Title:    " SK Pangkat Terakhir ",
		Category: string(model.ArsipPegawaiDocumentSK),
		Number:   " 001/SK/2026 ",
		Year:     "2026",
		Status:   "Lengkap",
	}

	if err := validateArsipPegawaiDocumentMetadataPayload(&payload); err != nil {
		t.Fatalf("validateArsipPegawaiDocumentMetadataPayload() error = %v", err)
	}
	if payload.Bidang != "pmk" {
		t.Fatalf("Bidang = %q, want pmk", payload.Bidang)
	}
	if payload.Title != "SK Pangkat Terakhir" {
		t.Fatalf("Title = %q", payload.Title)
	}
	if payload.Number != "001/SK/2026" {
		t.Fatalf("Number = %q", payload.Number)
	}
}

func TestValidateArsipPegawaiDocumentMetadataPayloadRequiresTitle(t *testing.T) {
	payload := model.ArsipPegawaiDocumentMetadataPayload{
		Bidang:   "sekretariat",
		Category: string(model.ArsipPegawaiDocumentLainnya),
	}

	err := validateArsipPegawaiDocumentMetadataPayload(&payload)
	httpError, ok := err.(*echo.HTTPError)
	if !ok || httpError.Code != http.StatusBadRequest {
		t.Fatalf("error = %v, want HTTP 400", err)
	}
}

func TestValidateArsipPegawaiPayloadAcceptsExtendedBiodata(t *testing.T) {
	payload := model.ArsipPegawaiPayload{
		NIP:        "199001012020011001",
		Name:       "Pegawai Uji",
		BirthPlace: " Sorong ",
		BirthDate:  "1990-01-01",
		Bidang:     " Bidang Pemerintahan ",
		Unit:       " Seksi Data ",
		Status:     "Nonaktif",
	}

	if err := validateArsipPegawaiPayload(&payload); err != nil {
		t.Fatalf("validateArsipPegawaiPayload() error = %v", err)
	}
	if payload.BirthPlace != "Sorong" || payload.Bidang != "Bidang Pemerintahan" {
		t.Fatalf("payload tidak dinormalisasi: %+v", payload)
	}
}

func TestValidateArsipPegawaiPayloadRejectsInvalidBirthDate(t *testing.T) {
	payload := model.ArsipPegawaiPayload{
		NIP:       "199001012020011001",
		Name:      "Pegawai Uji",
		BirthDate: "01-01-1990",
		Status:    "Aktif",
	}

	err := validateArsipPegawaiPayload(&payload)
	httpError, ok := err.(*echo.HTTPError)
	if !ok || httpError.Code != http.StatusBadRequest {
		t.Fatalf("error = %v, want HTTP 400", err)
	}
}

func TestValidateArsipPegawaiDocumentPayloadAcceptsNewCategories(t *testing.T) {
	for _, category := range []string{"SK CPNS", "SK PNS", "SPMT", "Ijazah", "KTP", "Sertifikat"} {
		payload := model.ArsipPegawaiDocumentPayload{
			Bidang:   "sekretariat",
			Category: category,
			Year:     "2026",
			Status:   "Lengkap",
		}
		if err := validateArsipPegawaiDocumentPayload(&payload); err != nil {
			t.Fatalf("category %q error = %v", category, err)
		}
	}
}
