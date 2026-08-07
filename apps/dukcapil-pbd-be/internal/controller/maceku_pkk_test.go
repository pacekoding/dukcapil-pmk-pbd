package controller

import (
	"net/http"
	"testing"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"
)

func TestDeriveMacekuPKKLevel(t *testing.T) {
	tests := []struct {
		name          string
		kabupatenKota string
		distrik       string
		kampung       string
		want          model.MacekuPKKLevel
	}{
		{
			name: "province level",
			want: model.MacekuPKKLevelProvinsi,
		},
		{
			name:          "kabupaten level",
			kabupatenKota: "Kota Sorong",
			want:          model.MacekuPKKLevelKabupaten,
		},
		{
			name:          "distrik level",
			kabupatenKota: "Kota Sorong",
			distrik:       "Sorong Barat",
			want:          model.MacekuPKKLevelDistrik,
		},
		{
			name:          "kampung level",
			kabupatenKota: "Kabupaten Sorong",
			distrik:       "Aimas",
			kampung:       "Malawele",
			want:          model.MacekuPKKLevelKampung,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := deriveMacekuPKKLevel(test.kabupatenKota, test.distrik, test.kampung)
			if got != test.want {
				t.Fatalf("deriveMacekuPKKLevel() = %q, want %q", got, test.want)
			}
		})
	}
}

func TestValidateMacekuProfilePayload(t *testing.T) {
	tests := []struct {
		name    string
		payload model.MacekuPKKProfilePayload
		wantErr bool
	}{
		{
			name: "valid province profile",
			payload: model.MacekuPKKProfilePayload{
				Name:  "TP PKK Provinsi Papua Barat Daya",
				Phone: "08123456789",
			},
		},
		{
			name: "valid kabupaten profile",
			payload: model.MacekuPKKProfilePayload{
				Name:          "TP PKK Kota Sorong",
				KabupatenKota: "Kota Sorong",
				Phone:         "08123456789",
			},
		},
		{
			name: "distrik without kabupaten",
			payload: model.MacekuPKKProfilePayload{
				Name:    "PKK Distrik X",
				Distrik: "Aimas",
				Phone:   "08123456789",
			},
			wantErr: true,
		},
		{
			name: "kampung without distrik",
			payload: model.MacekuPKKProfilePayload{
				Name:          "PKK Kampung X",
				KabupatenKota: "Kabupaten Sorong",
				Kampung:       "Klamono",
				Phone:         "08123456789",
			},
			wantErr: true,
		},
		{
			name: "invalid email",
			payload: model.MacekuPKKProfilePayload{
				Name:          "TP PKK Kota Sorong",
				KabupatenKota: "Kota Sorong",
				Phone:         "08123456789",
				Email:         "invalid-email",
			},
			wantErr: true,
		},
		{
			name: "missing phone",
			payload: model.MacekuPKKProfilePayload{
				Name:          "TP PKK Kota Sorong",
				KabupatenKota: "Kota Sorong",
			},
			wantErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateMacekuProfilePayload(&test.payload)
			if test.wantErr {
				assertHTTPErrorCode(t, err, http.StatusBadRequest)
				return
			}
			if err != nil {
				t.Fatalf("validateMacekuProfilePayload() error = %v", err)
			}
		})
	}
}

func TestEnsureMacekuScopeCanManage(t *testing.T) {
	claims := security.Claims{
		Role: model.RoleAdminPMK,
		RegionScope: model.UserRegionScope{
			KabupatenKota: "Kabupaten Sorong",
			Distrik:       "Aimas",
		},
	}

	if err := ensureMacekuScopeCanManage(claims, "Kabupaten Sorong", "Aimas", "Malawele"); err != nil {
		t.Fatalf("ensureMacekuScopeCanManage() unexpected error = %v", err)
	}

	err := ensureMacekuScopeCanManage(claims, "Kabupaten Sorong", "", "")
	assertHTTPErrorCode(t, err, http.StatusForbidden)
}

func TestValidateMacekuArchiveMetadata(t *testing.T) {
	valid := model.UpdateMacekuPKKArchivePayload{
		Title:        "Program Kerja 2026",
		Category:     model.MacekuPKKArchiveProgramKerja,
		DocumentYear: "2026",
		DocumentDate: "2026-07-23",
	}
	if err := validateMacekuArchiveMetadata(&valid); err != nil {
		t.Fatalf("validateMacekuArchiveMetadata() error = %v", err)
	}

	invalid := model.UpdateMacekuPKKArchivePayload{
		Title:        "Program Kerja 2026",
		Category:     model.MacekuPKKArchiveProgramKerja,
		DocumentYear: "26",
	}
	assertHTTPErrorCode(t, validateMacekuArchiveMetadata(&invalid), http.StatusBadRequest)
}

func TestMacekuServeMimeTypeInfersImageFromFilename(t *testing.T) {
	if got := documentServeMimeType("application/octet-stream", "logo-pkk.jpg"); got != "image/jpeg" {
		t.Fatalf("documentServeMimeType() = %q, want image/jpeg", got)
	}
	if got := documentServeMimeType("image/png", "logo-pkk.bin"); got != "image/png" {
		t.Fatalf("documentServeMimeType() = %q, want image/png", got)
	}
}
