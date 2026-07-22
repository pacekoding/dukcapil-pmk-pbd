package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"

	"github.com/labstack/echo"
)

func TestSiberDataWilayahTahunAnggaranUsesAuthenticatedClaims(t *testing.T) {
	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/?tahunAnggaran=1999", nil)
	context := e.NewContext(request, httptest.NewRecorder())
	context.Set(authmiddleware.ClaimsContextKey, security.Claims{TahunAnggaran: "2026"})

	tahunAnggaran, err := siberDataWilayahTahunAnggaran(context)
	if err != nil {
		t.Fatalf("siberDataWilayahTahunAnggaran() error = %v", err)
	}
	if tahunAnggaran != "2026" {
		t.Fatalf("siberDataWilayahTahunAnggaran() = %q, want authenticated year %q", tahunAnggaran, "2026")
	}
}

func TestSiberDataWilayahTahunAnggaranRejectsMissingOrInvalidClaims(t *testing.T) {
	tests := []struct {
		name       string
		claims     *security.Claims
		statusCode int
	}{
		{
			name:       "missing claims",
			statusCode: http.StatusUnauthorized,
		},
		{
			name:       "invalid year",
			claims:     &security.Claims{TahunAnggaran: "26"},
			statusCode: http.StatusBadRequest,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			e := echo.New()
			request := httptest.NewRequest(http.MethodGet, "/", nil)
			context := e.NewContext(request, httptest.NewRecorder())
			if test.claims != nil {
				context.Set(authmiddleware.ClaimsContextKey, *test.claims)
			}

			_, err := siberDataWilayahTahunAnggaran(context)
			assertHTTPErrorCode(t, err, test.statusCode)
		})
	}
}

func TestValidateDataWilayahDukcapilPayloadBounds(t *testing.T) {
	validPayload := model.DataWilayahDukcapilPayload{
		Oap: model.DataWilayahOapPayload{
			LuasWilayah:  6544.23,
			JumlahOap:    54379,
			JumlahNonOap: 76322,
		},
	}

	tests := []struct {
		name    string
		mutate  func(*model.DataWilayahDukcapilPayload)
		wantErr bool
	}{
		{
			name: "valid payload",
		},
		{
			name: "maximum numeric value",
			mutate: func(payload *model.DataWilayahDukcapilPayload) {
				payload.Oap.LuasWilayah = dataWilayahMaxLuasWilayah
			},
		},
		{
			name: "area above numeric maximum",
			mutate: func(payload *model.DataWilayahDukcapilPayload) {
				payload.Oap.LuasWilayah = 10000000000
			},
			wantErr: true,
		},
		{
			name: "area with three decimals",
			mutate: func(payload *model.DataWilayahDukcapilPayload) {
				payload.Oap.LuasWilayah = 12.345
			},
			wantErr: true,
		},
		{
			name: "negative area",
			mutate: func(payload *model.DataWilayahDukcapilPayload) {
				payload.Oap.LuasWilayah = -1
			},
			wantErr: true,
		},
		{
			name: "negative count",
			mutate: func(payload *model.DataWilayahDukcapilPayload) {
				payload.Civil.AktaKelahiran = -1
			},
			wantErr: true,
		},
		{
			name: "computed population above integer maximum",
			mutate: func(payload *model.DataWilayahDukcapilPayload) {
				payload.Oap.JumlahOap = dataWilayahMaxInteger
				payload.Oap.JumlahNonOap = 1
			},
			wantErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			payload := validPayload
			if test.mutate != nil {
				test.mutate(&payload)
			}

			err := validateDataWilayahDukcapilPayload(payload)
			if test.wantErr {
				assertHTTPErrorCode(t, err, http.StatusBadRequest)
				return
			}
			if err != nil {
				t.Fatalf("validateDataWilayahDukcapilPayload() error = %v", err)
			}
		})
	}
}

func assertHTTPErrorCode(t *testing.T, err error, expected int) {
	t.Helper()

	httpError, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("error = %T %v, want *echo.HTTPError", err, err)
	}
	if httpError.Code != expected {
		t.Fatalf("HTTP status = %d, want %d", httpError.Code, expected)
	}
}
