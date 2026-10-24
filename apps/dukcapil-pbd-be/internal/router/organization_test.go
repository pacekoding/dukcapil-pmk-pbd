package router

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"dukcapil-pbd-be/internal/controller"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"
)

type organizationStoreStub struct{}

func (organizationStoreStub) List(context.Context, model.OrganizationKind, model.OrganizationListParams) ([]model.OrganizationItem, error) {
	return []model.OrganizationItem{}, nil
}
func (organizationStoreStub) Save(context.Context, model.OrganizationKind, int64, model.OrganizationPayload) (model.OrganizationItem, error) {
	return model.OrganizationItem{}, nil
}
func (organizationStoreStub) Delete(context.Context, model.OrganizationKind, int64) error { return nil }

func TestOrganizationRoutesRequireInternalPermissions(t *testing.T) {
	tokens := security.NewManager("organization-test-key", time.Hour)
	e := New(Config{Organization: controller.NewOrganizationController(organizationStoreStub{}), AuthMiddleware: authmiddleware.NewAuthMiddleware(tokens)})
	for _, tc := range []struct {
		role         model.Role
		method, path string
		want         int
	}{
		{"", http.MethodGet, "/api/v1/organization/fields", http.StatusUnauthorized},
		{model.RoleAdminDukcapil, http.MethodGet, "/api/v1/organization/fields", http.StatusForbidden},
		{model.RoleAdminPMK, http.MethodGet, "/api/v1/organization/fields", http.StatusForbidden},
		{model.RoleAdminSekretariat, http.MethodGet, "/api/v1/organization/fields", http.StatusOK},
		{model.RoleSuperAdmin, http.MethodGet, "/api/v1/organization/fields", http.StatusOK},
		{model.RoleAdminSekretariat, http.MethodPost, "/api/v1/organization/fields", http.StatusForbidden},
		{model.RoleAdminSekretariat, http.MethodPut, "/api/v1/organization/fields/1", http.StatusForbidden},
		{model.RoleAdminSekretariat, http.MethodDelete, "/api/v1/organization/fields/1", http.StatusForbidden},
		{model.RoleSuperAdmin, http.MethodDelete, "/api/v1/organization/fields/1", http.StatusNoContent},
		{"", http.MethodGet, "/api/v1/website/organization/fields", http.StatusNotFound},
	} {
		req := httptest.NewRequest(tc.method, tc.path, nil)
		if tc.role != "" {
			token, err := tokens.Issue(model.User{ID: 1, Role: tc.role}, "2026")
			if err != nil {
				t.Fatal(err)
			}
			req.Header.Set("Authorization", "Bearer "+token)
		}
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != tc.want {
			t.Fatalf("role=%s %s %s: status=%d, body=%s", tc.role, tc.method, tc.path, rec.Code, rec.Body)
		}
	}
}
