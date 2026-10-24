package controller

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"github.com/labstack/echo"
)

type TravelStore interface {
	Options(context.Context) (model.TravelOptions, error)
	ListAssignments(context.Context, model.TravelListParams) ([]model.TravelAssignment, error)
	Assignment(context.Context, int64) (model.TravelAssignment, error)
	SaveAssignment(context.Context, int64, model.TravelAssignmentPayload, int64) (model.TravelAssignment, error)
	TransitionAssignment(context.Context, int64, int64, string, string) (model.TravelAssignment, error)
	DeleteAssignment(context.Context, int64) error
	ListOrders(context.Context, model.TravelListParams) ([]model.TravelOrder, error)
	Order(context.Context, int64) (model.TravelOrder, error)
	SaveOrder(context.Context, int64, model.TravelOrderPayload, int64) (model.TravelOrder, error)
	TransitionOrder(context.Context, int64, int64, string, string) (model.TravelOrder, error)
	DeleteOrder(context.Context, int64) error
}
type TravelController struct{ store TravelStore }

func NewTravelController(store TravelStore) *TravelController { return &TravelController{store: store} }
func travelHTTPError(err error) error {
	switch {
	case errors.Is(err, repository.ErrTravelInvalid):
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	case errors.Is(err, repository.ErrTravelConflict):
		return echo.NewHTTPError(http.StatusConflict, err.Error())
	case errors.Is(err, repository.ErrTravelNotFound):
		return echo.NewHTTPError(http.StatusNotFound, "Dokumen perjalanan dinas tidak ditemukan.")
	default:
		return echo.NewHTTPError(http.StatusInternalServerError, "Data perjalanan dinas gagal diproses. Silakan coba lagi.")
	}
}
func travelAssignmentKind(c echo.Context) (bool, error) {
	switch c.Param("kind") {
	case "assignment-letters":
		return true, nil
	case "spd":
		return false, nil
	default:
		return false, echo.NewHTTPError(http.StatusNotFound, "jenis dokumen tidak ditemukan")
	}
}
func travelID(c echo.Context) (int64, error) {
	id, e := strconv.ParseInt(c.Param("id"), 10, 64)
	if e != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "ID dokumen tidak valid")
	}
	return id, nil
}
func travelUser(c echo.Context) (int64, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok || claims.UserID <= 0 {
		return 0, echo.NewHTTPError(http.StatusUnauthorized, "sesi internal tidak valid")
	}
	return claims.UserID, nil
}
func travelNow() time.Time { return time.Now().In(time.FixedZone("WIT", 9*60*60)) }
func travelListParams(c echo.Context) (model.TravelListParams, error) {
	activityID := int64(0)
	if value := c.QueryParam("activity_execution_id"); value != "" {
		n, e := strconv.ParseInt(value, 10, 64)
		if e != nil || n <= 0 {
			return model.TravelListParams{}, echo.NewHTTPError(http.StatusBadRequest, "kegiatan tidak valid")
		}
		activityID = n
	}
	p := model.TravelListParams{ActivityExecutionID: activityID, Year: travelNow().Year(), Search: strings.TrimSpace(c.QueryParam("search")), Status: c.QueryParam("status"), Destination: strings.TrimSpace(c.QueryParam("destination"))}
	if value := c.QueryParam("year"); value != "" {
		if value == "all" {
			p.Year = 0
		} else {
			year, e := strconv.Atoi(value)
			if e != nil || year < 1900 || year > 9999 {
				return p, echo.NewHTTPError(http.StatusBadRequest, "tahun tidak valid")
			}
			p.Year = year
		}
	}
	switch p.Status {
	case "", "Draft", "Final", "Dibatalkan":
	default:
		return p, echo.NewHTTPError(http.StatusBadRequest, "status tidak valid")
	}
	if value := c.QueryParam("employee_id"); value != "" {
		id, e := strconv.ParseInt(value, 10, 64)
		if e != nil || id <= 0 {
			return p, echo.NewHTTPError(http.StatusBadRequest, "pegawai tidak valid")
		}
		p.EmployeeID = id
	}
	return p, nil
}
func (t *TravelController) Options(c echo.Context) error {
	item, e := t.store.Options(c.Request().Context())
	if e != nil {
		return travelHTTPError(e)
	}
	return jsonData(c, http.StatusOK, item)
}
func (t *TravelController) List(c echo.Context) error {
	assignment, e := travelAssignmentKind(c)
	if e != nil {
		return e
	}
	p, e := travelListParams(c)
	if e != nil {
		return e
	}
	if assignment {
		items, e := t.store.ListAssignments(c.Request().Context(), p)
		if e != nil {
			return travelHTTPError(e)
		}
		return jsonData(c, http.StatusOK, items)
	}
	items, e := t.store.ListOrders(c.Request().Context(), p)
	if e != nil {
		return travelHTTPError(e)
	}
	return jsonData(c, http.StatusOK, items)
}
func (t *TravelController) Detail(c echo.Context) error {
	assignment, e := travelAssignmentKind(c)
	if e != nil {
		return e
	}
	id, e := travelID(c)
	if e != nil {
		return e
	}
	if assignment {
		item, e := t.store.Assignment(c.Request().Context(), id)
		if e != nil {
			return travelHTTPError(e)
		}
		return jsonData(c, http.StatusOK, item)
	}
	item, e := t.store.Order(c.Request().Context(), id)
	if e != nil {
		return travelHTTPError(e)
	}
	return jsonData(c, http.StatusOK, item)
}
func (t *TravelController) Save(c echo.Context) error {
	assignment, e := travelAssignmentKind(c)
	if e != nil {
		return e
	}
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	var id int64
	status := http.StatusCreated
	if c.Param("id") != "" {
		id, e = travelID(c)
		if e != nil {
			return e
		}
		status = http.StatusOK
	}
	if assignment {
		var p model.TravelAssignmentPayload
		if e := c.Bind(&p); e != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "payload Surat Tugas tidak valid")
		}
		if e := repository.ValidateTravelAssignment(&p); e != nil {
			return travelHTTPError(e)
		}
		item, e := t.store.SaveAssignment(c.Request().Context(), id, p, user)
		if e != nil {
			return travelHTTPError(e)
		}
		return jsonData(c, status, item)
	}
	var p model.TravelOrderPayload
	if e := c.Bind(&p); e != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload SPD tidak valid")
	}
	if e := repository.ValidateTravelOrder(&p); e != nil {
		return travelHTTPError(e)
	}
	item, e := t.store.SaveOrder(c.Request().Context(), id, p, user)
	if e != nil {
		return travelHTTPError(e)
	}
	return jsonData(c, status, item)
}
func (t *TravelController) Transition(c echo.Context) error {
	assignment, e := travelAssignmentKind(c)
	if e != nil {
		return e
	}
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	id, e := travelID(c)
	if e != nil {
		return e
	}
	action := c.Param("action")
	if assignment && action == "duplicate" {
		source, e := t.store.Assignment(c.Request().Context(), id)
		if e != nil {
			return travelHTTPError(e)
		}
		p := source.TravelAssignmentPayload
		p.Number = ""
		p.DocumentDate = model.TravelDate(travelNow().Format("2006-01-02"))
		item, e := t.store.SaveAssignment(c.Request().Context(), 0, p, user)
		if e != nil {
			return travelHTTPError(e)
		}
		return jsonData(c, http.StatusCreated, item)
	}
	if action != "finalize" && action != "cancel" {
		return echo.NewHTTPError(http.StatusNotFound, "aksi dokumen tidak ditemukan")
	}
	var p struct {
		Reason string `json:"reason"`
	}
	if action == "cancel" {
		if e := c.Bind(&p); e != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "alasan pembatalan tidak valid")
		}
		if strings.TrimSpace(p.Reason) == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "alasan pembatalan wajib diisi")
		}
	}
	if assignment {
		item, e := t.store.TransitionAssignment(c.Request().Context(), id, user, action, p.Reason)
		if e != nil {
			return travelHTTPError(e)
		}
		return jsonData(c, http.StatusOK, item)
	}
	item, e := t.store.TransitionOrder(c.Request().Context(), id, user, action, p.Reason)
	if e != nil {
		return travelHTTPError(e)
	}
	return jsonData(c, http.StatusOK, item)
}
func (t *TravelController) Delete(c echo.Context) error {
	assignment, e := travelAssignmentKind(c)
	if e != nil {
		return e
	}
	id, e := travelID(c)
	if e != nil {
		return e
	}
	if assignment {
		e = t.store.DeleteAssignment(c.Request().Context(), id)
	} else {
		e = t.store.DeleteOrder(c.Request().Context(), id)
	}
	if e != nil {
		return travelHTTPError(e)
	}
	return c.NoContent(http.StatusNoContent)
}
