package controller

import (
	"net/http"
	"reflect"
	"testing"

	"dukcapil-pbd-be/internal/model"
)

func TestValidateSitekadCapaianKendalaPayload(t *testing.T) {
	validPayload := model.SitekadCapaianKendalaPayload{
		KelompokID:       12,
		NamaCapaian:      "Keripik Keladi",
		TahunBinaan:      "2026",
		DeskripsiCapaian: "Produk sudah dipasarkan di tingkat kabupaten.",
		KendalaHambatan:  "Kapasitas kemasan masih terbatas.",
		DokumentasiURLs: []string{
			"https://drive.google.com/example",
			"https://example.com/foto.jpg",
		},
	}

	if err := validateSitekadCapaianKendalaPayload(validPayload); err != nil {
		t.Fatalf("validateSitekadCapaianKendalaPayload() error = %v", err)
	}

	tests := []struct {
		name   string
		mutate func(*model.SitekadCapaianKendalaPayload)
	}{
		{
			name: "missing group",
			mutate: func(payload *model.SitekadCapaianKendalaPayload) {
				payload.KelompokID = 0
			},
		},
		{
			name: "missing achievement name",
			mutate: func(payload *model.SitekadCapaianKendalaPayload) {
				payload.NamaCapaian = " "
			},
		},
		{
			name: "invalid year",
			mutate: func(payload *model.SitekadCapaianKendalaPayload) {
				payload.TahunBinaan = "26"
			},
		},
		{
			name: "missing description",
			mutate: func(payload *model.SitekadCapaianKendalaPayload) {
				payload.DeskripsiCapaian = ""
			},
		},
		{
			name: "too many documentation links",
			mutate: func(payload *model.SitekadCapaianKendalaPayload) {
				payload.DokumentasiURLs = []string{
					"https://example.com/1",
					"https://example.com/2",
					"https://example.com/3",
					"https://example.com/4",
				}
			},
		},
		{
			name: "invalid documentation link",
			mutate: func(payload *model.SitekadCapaianKendalaPayload) {
				payload.DokumentasiURLs = []string{"javascript:alert(1)"}
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			payload := validPayload
			test.mutate(&payload)
			assertHTTPErrorCode(t, validateSitekadCapaianKendalaPayload(payload), http.StatusBadRequest)
		})
	}
}

func TestNormalizeSitekadDocumentationURLs(t *testing.T) {
	got := normalizeSitekadDocumentationURLs([]string{
		" https://example.com/foto.jpg ",
		"",
		"https://example.com/foto.jpg",
		"https://drive.google.com/example",
	})
	want := []string{
		"https://example.com/foto.jpg",
		"https://drive.google.com/example",
	}

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("normalizeSitekadDocumentationURLs() = %#v, want %#v", got, want)
	}
}
