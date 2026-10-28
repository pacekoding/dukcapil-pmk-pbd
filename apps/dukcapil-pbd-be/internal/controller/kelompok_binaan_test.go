package controller

import (
	"net/http"
	"testing"

	"dukcapil-pbd-be/internal/model"
)

func TestValidateKelompokBinaanPayload(t *testing.T) {
	validPayload := model.KelompokBinaanPayload{
		Kode:          "TEKAD-001",
		KabupatenKota: "Maybrat",
		Distrik:       "Aifat Selatan",
		Kampung:       "Rakam",
		NamaKelompok:  "Kelompok Tani Rakam",
		KategoriUsaha: model.KategoriPerikananDarat,
		JenisUsaha:    "Budidaya ikan air tawar",
		Komoditas:     "Budidaya Ikan Nila",
		JumlahAnggota: 8,
		DanaAlokasi:   100_000_000,
	}

	if err := validateKelompokBinaanPayload(validPayload); err != nil {
		t.Fatalf("validateKelompokBinaanPayload() error = %v", err)
	}

	tests := []struct {
		name   string
		mutate func(*model.KelompokBinaanPayload)
	}{
		{
			name: "missing district",
			mutate: func(payload *model.KelompokBinaanPayload) {
				payload.Distrik = ""
			},
		},
		{
			name: "missing group name",
			mutate: func(payload *model.KelompokBinaanPayload) {
				payload.NamaKelompok = ""
			},
		},
		{
			name: "missing commodity",
			mutate: func(payload *model.KelompokBinaanPayload) {
				payload.Komoditas = ""
			},
		},
		{
			name: "zero members",
			mutate: func(payload *model.KelompokBinaanPayload) {
				payload.JumlahAnggota = 0
			},
		},
		{
			name: "invalid category",
			mutate: func(payload *model.KelompokBinaanPayload) {
				payload.KategoriUsaha = "Tidak Valid"
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			payload := validPayload
			test.mutate(&payload)
			assertHTTPErrorCode(t, validateKelompokBinaanPayload(payload), http.StatusBadRequest)
		})
	}
}

func TestValidKategoriUsahaIncludesReferenceCategories(t *testing.T) {
	for _, kategori := range []model.KategoriUsaha{
		model.KategoriPerikananDarat,
		model.KategoriPerikananLaut,
	} {
		if !validKategoriUsaha(kategori) {
			t.Fatalf("validKategoriUsaha(%q) = false, want true", kategori)
		}
	}
}
