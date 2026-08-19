package controller

import (
	"net/http"
	"testing"

	"dukcapil-pbd-be/internal/model"
)

func TestValidateSitekadPayload(t *testing.T) {
	validPayload := model.SitekadPotensiKampungPayload{
		Kode:          "TEKAD-001",
		KabupatenKota: "Maybrat",
		Distrik:       "Aifat Selatan",
		Kampung:       "Rakam",
		NamaKelompok:  "Kelompok Tani Rakam",
		KategoriUsaha: model.SitekadKategoriPerikananDarat,
		JenisUsaha:    "Budidaya ikan air tawar",
		Komoditas:     "Budidaya Ikan Nila",
		JumlahAnggota: 8,
		DanaAlokasi:   100_000_000,
	}

	if err := validateSitekadPayload(validPayload); err != nil {
		t.Fatalf("validateSitekadPayload() error = %v", err)
	}

	tests := []struct {
		name   string
		mutate func(*model.SitekadPotensiKampungPayload)
	}{
		{
			name: "missing district",
			mutate: func(payload *model.SitekadPotensiKampungPayload) {
				payload.Distrik = ""
			},
		},
		{
			name: "missing group name",
			mutate: func(payload *model.SitekadPotensiKampungPayload) {
				payload.NamaKelompok = ""
			},
		},
		{
			name: "missing commodity",
			mutate: func(payload *model.SitekadPotensiKampungPayload) {
				payload.Komoditas = ""
			},
		},
		{
			name: "zero members",
			mutate: func(payload *model.SitekadPotensiKampungPayload) {
				payload.JumlahAnggota = 0
			},
		},
		{
			name: "invalid category",
			mutate: func(payload *model.SitekadPotensiKampungPayload) {
				payload.KategoriUsaha = "Tidak Valid"
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			payload := validPayload
			test.mutate(&payload)
			assertHTTPErrorCode(t, validateSitekadPayload(payload), http.StatusBadRequest)
		})
	}
}

func TestValidSitekadKategoriUsahaIncludesReferenceCategories(t *testing.T) {
	for _, kategori := range []model.SitekadKategoriUsaha{
		model.SitekadKategoriPerikananDarat,
		model.SitekadKategoriPerikananLaut,
	} {
		if !validSitekadKategoriUsaha(kategori) {
			t.Fatalf("validSitekadKategoriUsaha(%q) = false, want true", kategori)
		}
	}
}
