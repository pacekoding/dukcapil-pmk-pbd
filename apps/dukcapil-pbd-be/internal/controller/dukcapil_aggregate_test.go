package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"

	"github.com/labstack/echo"
)

type dukcapilAggregateStoreStub struct {
	populationList model.DukcapilAggregateResponse[model.PopulationRegistrationData]
	population     model.DukcapilAggregateRegion[model.PopulationRegistrationData]
	civil          model.DukcapilAggregateRegion[model.CivilRegistrationData]
	updatedYear    string
	updatedID      string
}

func (s *dukcapilAggregateStoreStub) List(context.Context, string) (model.DataWilayahResponse, error) {
	return model.DataWilayahResponse{}, nil
}
func (s *dukcapilAggregateStoreStub) UpdateDukcapil(context.Context, string, string, model.DataWilayahDukcapilPayload) (model.RegionData, bool, error) {
	return model.RegionData{}, false, nil
}
func (s *dukcapilAggregateStoreStub) ListPopulationRegistration(context.Context, string) (model.DukcapilAggregateResponse[model.PopulationRegistrationData], error) {
	return s.populationList, nil
}
func (s *dukcapilAggregateStoreStub) GetPopulationRegistration(context.Context, string, string) (model.DukcapilAggregateRegion[model.PopulationRegistrationData], bool, error) {
	return s.population, true, nil
}
func (s *dukcapilAggregateStoreStub) UpdatePopulationRegistration(_ context.Context, year, id string, payload model.PopulationRegistrationData) (model.DukcapilAggregateRegion[model.PopulationRegistrationData], bool, error) {
	s.updatedYear, s.updatedID = year, id
	s.population.Data = payload
	return s.population, true, nil
}
func (s *dukcapilAggregateStoreStub) ListCivilRegistration(context.Context, string) (model.DukcapilAggregateResponse[model.CivilRegistrationData], error) {
	return model.DukcapilAggregateResponse[model.CivilRegistrationData]{}, nil
}
func (s *dukcapilAggregateStoreStub) GetCivilRegistration(context.Context, string, string) (model.DukcapilAggregateRegion[model.CivilRegistrationData], bool, error) {
	return s.civil, true, nil
}
func (s *dukcapilAggregateStoreStub) UpdateCivilRegistration(_ context.Context, year, id string, payload model.CivilRegistrationData) (model.DukcapilAggregateRegion[model.CivilRegistrationData], bool, error) {
	s.updatedYear, s.updatedID = year, id
	s.civil.Data = payload
	return s.civil, true, nil
}
func (s *dukcapilAggregateStoreStub) GetWebsiteSettings(context.Context) (model.DataWilayahWebsiteSettingsResponse, error) {
	return model.DataWilayahWebsiteSettingsResponse{}, nil
}
func (s *dukcapilAggregateStoreStub) UpdateWebsiteSettings(context.Context, model.DataWilayahWebsiteSettingsPayload) (model.DataWilayahWebsiteSettingsResponse, error) {
	return model.DataWilayahWebsiteSettingsResponse{}, nil
}

func TestPopulationRegistrationListReturnsSixRegionsForAuthenticatedYear(t *testing.T) {
	regions := make([]model.DukcapilAggregateRegion[model.PopulationRegistrationData], 6)
	store := &dukcapilAggregateStoreStub{
		populationList: model.DukcapilAggregateResponse[model.PopulationRegistrationData]{
			TahunAnggaran: "2026",
			Regions:       regions,
		},
	}
	controller := NewDataWilayahController(store)
	context, recorder := newDukcapilAggregateContext(http.MethodGet, "/", nil, "2026", "")

	if err := controller.PopulationRegistrationList(context); err != nil {
		t.Fatalf("PopulationRegistrationList() error = %v", err)
	}
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	var response struct {
		Data model.DukcapilAggregateResponse[model.PopulationRegistrationData] `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if response.Data.TahunAnggaran != "2026" || len(response.Data.Regions) != 6 {
		t.Fatalf("response = year %q, %d regions; want 2026 and 6", response.Data.TahunAnggaran, len(response.Data.Regions))
	}
}

func TestUpdatePopulationRegistrationUsesAuthenticatedYear(t *testing.T) {
	payload := model.PopulationRegistrationData{
		PenerbitanKk: 1, PerubahanKk: 2, Kia: 3, NikWni: 4,
		PerekamanKtpEl: 5, PencetakanKtpEl: 6, PindahDatang: 7, PindahKeluar: 8,
	}
	body, _ := json.Marshal(payload)
	store := &dukcapilAggregateStoreStub{
		population: model.DukcapilAggregateRegion[model.PopulationRegistrationData]{ID: "kabupaten-sorong"},
	}
	controller := NewDataWilayahController(store)
	context, recorder := newDukcapilAggregateContext(http.MethodPut, "/kabupaten-sorong", body, "2026", "kabupaten-sorong")

	if err := controller.UpdatePopulationRegistration(context); err != nil {
		t.Fatalf("UpdatePopulationRegistration() error = %v", err)
	}
	if recorder.Code != http.StatusOK || store.updatedYear != "2026" || store.updatedID != "kabupaten-sorong" {
		t.Fatalf("status/year/id = %d/%q/%q", recorder.Code, store.updatedYear, store.updatedID)
	}
	if store.population.Data != payload {
		t.Fatalf("saved payload = %+v, want %+v", store.population.Data, payload)
	}
}

func TestUpdateCivilRegistrationPersistsDetailedOtherFields(t *testing.T) {
	payload := model.CivilRegistrationData{
		AktaKelahiran: 10, PembatalanPerkawinan: 2, PembatalanPerceraian: 3,
		PerubahanStatusKewarganegaraan: 4, PembetulanAkta: 5, PembatalanAkta: 6,
		PeristiwaPentingLainnya: 7,
	}
	body, _ := json.Marshal(payload)
	store := &dukcapilAggregateStoreStub{
		civil: model.DukcapilAggregateRegion[model.CivilRegistrationData]{ID: "kota-sorong"},
	}
	controller := NewDataWilayahController(store)
	context, recorder := newDukcapilAggregateContext(http.MethodPut, "/kota-sorong", body, "2026", "kota-sorong")

	if err := controller.UpdateCivilRegistration(context); err != nil {
		t.Fatalf("UpdateCivilRegistration() error = %v", err)
	}
	if recorder.Code != http.StatusOK || store.civil.Data != payload {
		t.Fatalf("status/payload = %d/%+v", recorder.Code, store.civil.Data)
	}
}

func TestDukcapilAggregateValidationRejectsNegativeValues(t *testing.T) {
	population := model.PopulationRegistrationData{PindahKeluar: -1}
	assertHTTPErrorCode(t, validatePopulationRegistrationPayload(population), http.StatusBadRequest)

	civil := model.CivilRegistrationData{PembetulanAkta: -1}
	assertHTTPErrorCode(t, validateCivilRegistrationPayload(civil), http.StatusBadRequest)

	if err := validatePopulationRegistrationPayload(model.PopulationRegistrationData{}); err != nil {
		t.Fatalf("zero population payload must be valid: %v", err)
	}
	if err := validateCivilRegistrationPayload(model.CivilRegistrationData{}); err != nil {
		t.Fatalf("zero civil payload must be valid: %v", err)
	}
}

func newDukcapilAggregateContext(method, path string, body []byte, year, id string) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	request := httptest.NewRequest(method, path, bytes.NewReader(body))
	request.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	recorder := httptest.NewRecorder()
	context := e.NewContext(request, recorder)
	context.Set(authmiddleware.ClaimsContextKey, security.Claims{TahunAnggaran: year})
	if id != "" {
		context.SetParamNames("id")
		context.SetParamValues(id)
	}
	return context, recorder
}
