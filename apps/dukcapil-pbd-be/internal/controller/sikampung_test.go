package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo"
)

func TestSikampungListTahunAnggaranAllowsOperationalYears(t *testing.T) {
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

			got, err := sikampungListTahunAnggaran(context)
			if err != nil {
				t.Fatalf("sikampungListTahunAnggaran() error = %v", err)
			}
			if got != test.want {
				t.Fatalf("sikampungListTahunAnggaran() = %q, want %q", got, test.want)
			}
		})
	}
}

func TestSikampungListTahunAnggaranRejectsUnsupportedQueryYear(t *testing.T) {
	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/?tahunAnggaran=2024", nil)
	context := e.NewContext(request, httptest.NewRecorder())

	_, err := sikampungListTahunAnggaran(context)
	assertHTTPErrorCode(t, err, http.StatusBadRequest)
}
