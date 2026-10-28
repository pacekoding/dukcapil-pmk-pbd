package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo"
)

func TestDataKampungListTahunAnggaranAllowsOperationalYears(t *testing.T) {
	tests := []struct {
		name string
		path string
		want string
	}{
		{
			name: "tahunAnggaran query",
			path: "/?tahunAnggaran=2026",
			want: "2026",
		},
		{
			name: "snake case query",
			path: "/?tahun_anggaran=2025",
			want: "2025",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			e := echo.New()
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			context := e.NewContext(request, httptest.NewRecorder())

			got, err := dataKampungListTahunAnggaran(context)
			if err != nil {
				t.Fatalf("dataKampungListTahunAnggaran() error = %v", err)
			}
			if got != test.want {
				t.Fatalf("dataKampungListTahunAnggaran() = %q, want %q", got, test.want)
			}
		})
	}
}

func TestDataKampungListTahunAnggaranRejectsUnsupportedQueryYear(t *testing.T) {
	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/?tahunAnggaran=2024", nil)
	context := e.NewContext(request, httptest.NewRecorder())

	_, err := dataKampungListTahunAnggaran(context)
	assertHTTPErrorCode(t, err, http.StatusBadRequest)
}

func TestDataKampungPositiveQueryInt(t *testing.T) {
	tests := []struct {
		name     string
		path     string
		fallback int
		maximum  int
		want     int
		wantCode int
	}{
		{
			name:     "uses fallback when omitted",
			path:     "/",
			fallback: 10,
			maximum:  100,
			want:     10,
		},
		{
			name:     "accepts positive value",
			path:     "/?pageSize=25",
			fallback: 10,
			maximum:  100,
			want:     25,
		},
		{
			name:     "rejects zero",
			path:     "/?pageSize=0",
			fallback: 10,
			maximum:  100,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "rejects value over maximum",
			path:     "/?pageSize=101",
			fallback: 10,
			maximum:  100,
			wantCode: http.StatusBadRequest,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			e := echo.New()
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			context := e.NewContext(request, httptest.NewRecorder())

			got, err := dataKampungPositiveQueryInt(
				context,
				"pageSize",
				test.fallback,
				test.maximum,
			)
			if test.wantCode != 0 {
				assertHTTPErrorCode(t, err, test.wantCode)
				return
			}
			if err != nil {
				t.Fatalf("dataKampungPositiveQueryInt() error = %v", err)
			}
			if got != test.want {
				t.Fatalf("dataKampungPositiveQueryInt() = %d, want %d", got, test.want)
			}
		})
	}
}
