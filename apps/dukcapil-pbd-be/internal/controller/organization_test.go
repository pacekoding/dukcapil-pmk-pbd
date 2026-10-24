package controller

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"github.com/labstack/echo"
)

type organizationStoreStub struct {
	params  model.OrganizationListParams
	payload model.OrganizationPayload
	err     error
}

func (s *organizationStoreStub) List(_ context.Context, _ model.OrganizationKind, p model.OrganizationListParams) ([]model.OrganizationItem, error) {
	s.params = p
	return []model.OrganizationItem{}, s.err
}
func (s *organizationStoreStub) Save(_ context.Context, _ model.OrganizationKind, id int64, p model.OrganizationPayload) (model.OrganizationItem, error) {
	s.payload = p
	return model.OrganizationItem{ID: id, Name: p.Name, IsActive: p.IsActive}, s.err
}
func (s *organizationStoreStub) Delete(context.Context, model.OrganizationKind, int64) error {
	return s.err
}

func TestOrganizationListFilters(t *testing.T) {
	e := echo.New()
	store := &organizationStoreStub{}
	c := e.NewContext(httptest.NewRequest(http.MethodGet, "/?bidang_id=2&seksi_id=3&active=true&search=data", nil), httptest.NewRecorder())
	c.SetParamNames("kind")
	c.SetParamValues("positions")
	if err := NewOrganizationController(store).List(c); err != nil {
		t.Fatal(err)
	}
	if store.params.BidangID == nil || *store.params.BidangID != 2 || store.params.SeksiID == nil || *store.params.SeksiID != 3 || store.params.Active == nil || !*store.params.Active || store.params.Search != "data" {
		t.Fatalf("params = %+v", store.params)
	}
	for _, query := range []string{"bidang_id=no", "bidang_id=0", "seksi_id=-1", "active=invalid"} {
		c := e.NewContext(httptest.NewRequest(http.MethodGet, "/?"+query, nil), httptest.NewRecorder())
		c.SetParamNames("kind")
		c.SetParamValues("sections")
		err := NewOrganizationController(store).List(c)
		var httpErr *echo.HTTPError
		if !errors.As(err, &httpErr) || httpErr.Code != http.StatusBadRequest {
			t.Fatalf("%s error = %v", query, err)
		}
	}
}

func TestOrganizationValidationAndStatus(t *testing.T) {
	for _, tc := range []struct {
		body, kind string
		want       int
	}{
		{`{"name":"  Bidang   Baru  "}`, "fields", http.StatusCreated},
		{`{"name":"Bidang","isActive":false}`, "fields", http.StatusCreated},
		{`{"name":"Seksi","bidangId":1}`, "sections", http.StatusCreated},
		{`{"name":"Jabatan","bidangId":1}`, "positions", http.StatusCreated},
		{`{"name":"  "}`, "fields", http.StatusBadRequest},
		{`{"name":"Seksi"}`, "sections", http.StatusBadRequest},
		{`{"name":"Jabatan","bidangId":-1}`, "positions", http.StatusBadRequest},
		{`{"name":"Unknown"}`, "unknown", http.StatusNotFound},
	} {
		t.Run(tc.kind+tc.body, func(t *testing.T) {
			store := &organizationStoreStub{}
			e := echo.New()
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tc.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			c := e.NewContext(req, rec)
			c.SetParamNames("kind")
			c.SetParamValues(tc.kind)
			err := NewOrganizationController(store).Save(c)
			if err != nil {
				e.HTTPErrorHandler(err, c)
			}
			if rec.Code != tc.want {
				t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
			}
			if tc.body == `{"name":"  Bidang   Baru  "}` && (store.payload.Name != "Bidang Baru" || !store.payload.IsActive) {
				t.Fatalf("payload = %+v", store.payload)
			}
			if strings.Contains(tc.body, `"isActive":false`) && store.payload.IsActive {
				t.Fatal("explicit inactive status ignored")
			}
		})
	}
}

func TestOrganizationErrorsAreSafeAndSpecific(t *testing.T) {
	for _, tc := range []struct {
		err    error
		status int
	}{
		{repository.ErrOrganizationInvalid, http.StatusBadRequest},
		{repository.ErrOrganizationDuplicate, http.StatusConflict},
		{repository.ErrOrganizationUsed, http.StatusConflict},
		{repository.ErrOrganizationNotFound, http.StatusNotFound},
		{errors.New("secret database details"), http.StatusInternalServerError},
	} {
		httpErr := organizationHTTPError(tc.err).(*echo.HTTPError)
		if httpErr.Code != tc.status || strings.Contains(httpErr.Message.(string), "secret") {
			t.Fatalf("error = %+v", httpErr)
		}
	}
	store := &organizationStoreStub{err: repository.ErrOrganizationUsed}
	e := echo.New()
	c := e.NewContext(httptest.NewRequest(http.MethodDelete, "/", nil), httptest.NewRecorder())
	c.SetParamNames("kind", "id")
	c.SetParamValues("fields", "1")
	err := NewOrganizationController(store).Delete(c).(*echo.HTTPError)
	if err.Code != http.StatusConflict || err.Message != "Bidang tidak dapat dihapus karena masih digunakan." {
		t.Fatalf("error = %+v", err)
	}
}
