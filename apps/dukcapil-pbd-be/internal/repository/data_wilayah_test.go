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
		},
		{
			Name:      "Kota Sorong",
			ShortName: "Kota Sorong",
		},
	}
	summaries := []bumKampungRegionSummary{
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
	assertBumdesData(t, regions[2].Bumdes, model.BumdesData{})
}

func assertBumdesData(t *testing.T, got, want model.BumdesData) {
	t.Helper()

	if got != want {
		t.Fatalf("Bumdes = %+v, want %+v", got, want)
	}
}
