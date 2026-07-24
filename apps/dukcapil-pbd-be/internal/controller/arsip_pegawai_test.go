package controller

import (
	"net/http"
	"testing"

	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

func TestValidateArsipPegawaiDocumentPayload(t *testing.T) {
	payload := model.ArsipPegawaiDocumentPayload{}
	if err := validateArsipPegawaiDocumentPayload(&payload); err != nil {
		t.Fatalf("validateArsipPegawaiDocumentPayload() error = %v", err)
	}
	if payload.Category != string(model.ArsipPegawaiDocumentLainnya) {
		t.Fatalf("Category = %q", payload.Category)
	}
	if payload.Status != "Lengkap" {
		t.Fatalf("Status = %q", payload.Status)
	}
}

func TestValidateArsipPegawaiDocumentPayloadRejectsInvalidMetadata(t *testing.T) {
	tests := []model.ArsipPegawaiDocumentPayload{
		{Category: "Rahasia"},
		{Category: string(model.ArsipPegawaiDocumentSK), Year: "26"},
		{Category: string(model.ArsipPegawaiDocumentSK), Year: "2026", Status: "Rusak"},
	}

	for _, payload := range tests {
		err := validateArsipPegawaiDocumentPayload(&payload)
		httpError, ok := err.(*echo.HTTPError)
		if !ok || httpError.Code != http.StatusBadRequest {
			t.Fatalf("payload %+v error = %v, want HTTP 400", payload, err)
		}
	}
}
