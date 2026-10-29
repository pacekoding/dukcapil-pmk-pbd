package repository

import (
	"errors"
	"testing"

	"dukcapil-pbd-be/internal/model"
)

func TestValidateOtsusPayload(t *testing.T) {
	valid := model.OtsusPayload{SubkegiatanID: 1, Pagu: 1000, Realisasi: 500, SumberDana: model.OtsusSumberDanaSG, Status: model.OtsusStatusBerjalan}
	if err := ValidateOtsusPayload(valid); err != nil {
		t.Fatalf("valid payload rejected: %v", err)
	}
	tests := []struct {
		name   string
		mutate func(*model.OtsusPayload)
	}{
		{"missing subkegiatan", func(p *model.OtsusPayload) { p.SubkegiatanID = 0 }},
		{"negative pagu", func(p *model.OtsusPayload) { p.Pagu = -1 }},
		{"negative realisasi", func(p *model.OtsusPayload) { p.Realisasi = -1 }},
		{"realisasi over pagu", func(p *model.OtsusPayload) { p.Realisasi = 1001 }},
		{"invalid sumber dana", func(p *model.OtsusPayload) { p.SumberDana = "LAINNYA" }},
		{"invalid status", func(p *model.OtsusPayload) { p.Status = "LAINNYA" }},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := valid
			test.mutate(&p)
			if err := ValidateOtsusPayload(p); !errors.Is(err, ErrOtsusInvalid) {
				t.Fatalf("error = %v, want ErrOtsusInvalid", err)
			}
		})
	}
}
