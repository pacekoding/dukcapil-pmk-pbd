package repository

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/model"
)

func countKegiatanByStatus(items []model.Kegiatan, status string) int {
	total := 0
	for _, item := range items {
		if item.Status == status {
			total++
		}
	}
	return total
}

func relativeActivityTime(index int) string {
	values := []string{"2 jam lalu", "5 jam lalu", "1 hari lalu"}
	if index >= 0 && index < len(values) {
		return values[index]
	}
	return "Baru saja"
}

func ringkasan(description string) string {
	parts := strings.Split(description, "\n\nDetail ")
	if strings.TrimSpace(parts[0]) != "" {
		return strings.TrimSpace(parts[0])
	}
	return strings.TrimSpace(description)
}

func websiteStats(items []model.PublicKegiatanItem) []model.WebsiteStat {
	totalPeserta := 0
	totalDokumen := 0
	totalSelesai := 0
	for _, item := range items {
		totalPeserta += item.Peserta
		totalDokumen += item.Dokumen.Total
		if item.Status == "Selesai" {
			totalSelesai++
		}
	}

	return []model.WebsiteStat{
		{Label: "Kegiatan", Value: strconv.Itoa(len(items)), Description: "Kegiatan lintas bidang"},
		{Label: "Dokumen", Value: strconv.Itoa(totalDokumen), Description: "TOR dan laporan yang tersedia"},
		{Label: "Peserta", Value: formatIntegerID(totalPeserta), Description: "Akumulasi peserta kegiatan"},
		{Label: "Selesai", Value: strconv.Itoa(totalSelesai), Description: "Kegiatan sudah masuk arsip"},
	}
}

func publicJenisOptions(items []model.PublicKegiatanItem) []string {
	seen := map[string]bool{}
	for _, item := range items {
		seen[item.Jenis] = true
	}

	result := make([]string, 0, len(seen))
	for jenis := range seen {
		result = append(result, jenis)
	}
	sort.Strings(result)
	return result
}

func formatIntegerID(value int) string {
	return strings.ReplaceAll(fmt.Sprintf("%d", value), ",", ".")
}
