package repository

import (
	"testing"

	"dukcapil-pbd-be/internal/model"
)

func TestApplyBumKampungSummaryMapsSibumDataToWebsiteRegions(t *testing.T) {
	regions := []model.RegionData{
		{
			Name:      "Kabupaten Maybrat",
			ShortName: "Maybrat",
			Type:      "Kabupaten",
			Bumdes: model.BumdesData{
				Jumlah:     99,
				Aktif:      99,
				TidakAktif: 99,
				Bersama:    99,
			},
		},
		{
			Name:      "Kabupaten Raja Ampat",
			ShortName: "Raja Ampat",
			Type:      "Kabupaten",
		},
		{
			Name:      "Kabupaten Sorong",
			ShortName: "Sorong",
			Type:      "Kabupaten",
		},
		{
			Name:      "Kota Sorong",
			ShortName: "Kota Sorong",
			Type:      "Kota",
		},
	}
	summaries := []bumKampungRegionSummary{
		{
			KabupatenKota: "SORONG",
			Jumlah:        68,
			Aktif:         55,
			TidakAktif:    13,
			Bersama:       1,
		},
		{
			KabupatenKota: "MAYBRAT",
			Jumlah:        242,
			Aktif:         229,
			TidakAktif:    13,
			Bersama:       16,
		},
		{
			KabupatenKota: "RAJA AMPAT",
			Jumlah:        53,
			Aktif:         50,
			TidakAktif:    3,
			Bersama:       0,
		},
	}

	applyBumKampungSummary(regions, summaries)

	assertBumdesData(t, regions[0].Bumdes, model.BumdesData{
		Jumlah:     242,
		Aktif:      229,
		TidakAktif: 13,
		Bersama:    16,
	})
	assertBumdesData(t, regions[1].Bumdes, model.BumdesData{
		Jumlah:     53,
		Aktif:      50,
		TidakAktif: 3,
		Bersama:    0,
	})
	assertBumdesData(t, regions[2].Bumdes, model.BumdesData{
		Jumlah:     68,
		Aktif:      55,
		TidakAktif: 13,
		Bersama:    1,
	})
	assertBumdesData(t, regions[3].Bumdes, model.BumdesData{})
}

func TestApplySikampungSummaryMapsOperationalIdmData(t *testing.T) {
	regions := []model.RegionData{
		{
			Name:      "Kabupaten Sorong",
			ShortName: "Sorong",
			Type:      "Kabupaten",
			Idm: model.IdmData{
				SangatTertinggal: 99,
			},
		},
		{
			Name:      "Kota Sorong",
			ShortName: "Kota Sorong",
			Type:      "Kota",
			Idm: model.IdmData{
				Tertinggal: 99,
			},
		},
	}
	summaries := []sikampungRegionSummary{
		{
			Kabupaten:        "SORONG",
			SangatTertinggal: 68,
			Tertinggal:       133,
			Berkembang:       26,
		},
	}

	applySikampungSummary(regions, summaries)

	assertIdmData(t, regions[0].Idm, model.IdmData{
		SangatTertinggal: 68,
		Tertinggal:       133,
		Berkembang:       26,
	})
	assertIdmData(t, regions[1].Idm, model.IdmData{})
}

func assertBumdesData(t *testing.T, got, want model.BumdesData) {
	t.Helper()

	if got != want {
		t.Fatalf("Bumdes = %+v, want %+v", got, want)
	}
}

func assertIdmData(t *testing.T, got, want model.IdmData) {
	t.Helper()

	if got != want {
		t.Fatalf("IDM = %+v, want %+v", got, want)
	}
}
