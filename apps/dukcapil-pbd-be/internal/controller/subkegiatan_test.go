package controller

import (
	"net/http"
	"testing"

	"dukcapil-pbd-be/internal/model"
)

func TestValidateSubkegiatanPayload(t *testing.T) {
	valid := model.SubkegiatanPayload{
		Bidang:              "2.12 Urusan Pemerintahan",
		Program:             "2.12.02 Program Pendaftaran Penduduk",
		Kegiatan:            "Pelayanan Pendaftaran Kependudukan",
		Subkegiatan:         "Penetapan Kebijakan Teknis",
		Kinerja:             "Terlaksananya penetapan kebijakan teknis",
		Indikator:           "Jumlah dokumen kebijakan teknis",
		Satuan:              "Dokumen",
		DefinisiOperasional: "Definisi layanan pendaftaran penduduk.",
	}

	if err := validateSubkegiatanPayload(valid); err != nil {
		t.Fatalf("validateSubkegiatanPayload() error = %v", err)
	}

	invalid := valid
	invalid.Indikator = "  "
	assertHTTPErrorCode(t, validateSubkegiatanPayload(invalid), http.StatusBadRequest)
}
