package router

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"dukcapil-pbd-be/internal/controller"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/security"
)

type travelRouteStore struct{ controller.TravelStore }

func (travelRouteStore) Options(context.Context) (model.TravelOptions, error) {
	return model.TravelOptions{}, nil
}
func (travelRouteStore) ListAssignments(context.Context, model.TravelListParams) ([]model.TravelAssignment, error) {
	return []model.TravelAssignment{}, nil
}
func (travelRouteStore) ListOrders(context.Context, model.TravelListParams) ([]model.TravelOrder, error) {
	return []model.TravelOrder{}, nil
}
func (travelRouteStore) DeleteAssignment(context.Context, int64) error { return nil }
func (travelRouteStore) DeleteOrder(context.Context, int64) error      { return nil }
func (travelRouteStore) SaveAssignment(_ context.Context, _ int64, p model.TravelAssignmentPayload, user int64) (model.TravelAssignment, error) {
	return model.TravelAssignment{TravelAssignmentPayload: p, TravelAudit: model.TravelAudit{CreatedBy: user}}, nil
}
func TestTravelRoutesForAllInternalRoles(t *testing.T) {
	tokens := security.NewManager("travel-test-key", time.Hour)
	e := New(Config{Travel: controller.NewTravelController(travelRouteStore{}), AuthMiddleware: authmiddleware.NewAuthMiddleware(tokens)})
	for _, role := range []model.Role{model.RoleSuperAdmin, model.RoleAdminSekretariat, model.RoleAdminDukcapil, model.RoleAdminPMK} {
		token, err := tokens.Issue(model.User{ID: 1, Role: role}, "2026")
		if err != nil {
			t.Fatal(err)
		}
		for _, tc := range []struct {
			method, path, body string
			want               int
		}{
			{http.MethodGet, "/api/v1/travel/options", "", 200}, {http.MethodGet, "/api/v1/travel/assignment-letters", "", 200}, {http.MethodGet, "/api/v1/travel/spd", "", 200},
			{http.MethodPost, "/api/v1/travel/assignment-letters", `{"documentDate":"2026-10-24","issuePlace":"Sorong","bases":["Dasar"],"instructions":["Tugas"],"employeeIds":[2],"origin":"Sorong","destination":"Kabupaten Sorong","departureDate":"2026-10-26","returnDate":"2026-10-28","tripType":"Dalam Daerah","signerId":3}`, 201},
			{http.MethodPut, "/api/v1/travel/spd/1", `{}`, 400}, {http.MethodDelete, "/api/v1/travel/assignment-letters/1", "", 204}, {http.MethodDelete, "/api/v1/travel/spd/1", "", 204},
			{http.MethodPost, "/api/v1/travel/spd/1/cancel", `{"reason":""}`, 400}, {http.MethodGet, "/api/v1/travel/spd?year=invalid", "", 400}, {http.MethodGet, "/api/v1/travel/spd?status=Unknown", "", 400},
		} {
			req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			req.Header.Set("Authorization", "Bearer "+token)
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if rec.Code != tc.want {
				t.Fatalf("role %s %s %s=%d: %s", role, tc.method, tc.path, rec.Code, rec.Body)
			}
		}
	}
	for _, method := range []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete} {
		path := "/api/v1/travel/spd/1"
		if method == http.MethodPost {
			path = "/api/v1/travel/spd"
		}
		req := httptest.NewRequest(method, path, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("anonymous %s=%d", method, rec.Code)
		}
	}
}
