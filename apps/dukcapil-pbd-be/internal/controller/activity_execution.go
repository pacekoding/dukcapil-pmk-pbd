package controller

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"dukcapil-pbd-be/internal/fileasset"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"github.com/labstack/echo"
)

func activityHTTPError(err error) error {
	switch {
	case errors.Is(err, repository.ErrTravelInvalid):
		return echo.NewHTTPError(400, strings.ReplaceAll(err.Error(), "perjalanan dinas", "kegiatan"))
	case errors.Is(err, repository.ErrTravelConflict):
		return echo.NewHTTPError(409, err.Error())
	case errors.Is(err, repository.ErrTravelNotFound):
		return echo.NewHTTPError(404, "Data kegiatan atau dokumen tidak ditemukan.")
	default:
		return echo.NewHTTPError(500, "Data kegiatan gagal diproses. Silakan coba lagi.")
	}
}

type ActivityController struct {
	store  *repository.ActivityRepository
	travel *repository.TravelRepository
	files  *fileasset.Service
}

func NewActivityController(store *repository.ActivityRepository, travel *repository.TravelRepository, files *fileasset.Service) *ActivityController {
	return &ActivityController{store: store, travel: travel, files: files}
}
func activityParams(c echo.Context) (model.ActivityListParams, error) {
	p := model.ActivityListParams{Search: strings.TrimSpace(c.QueryParam("search")), Status: c.QueryParam("status"), ActivityType: c.QueryParam("activity_type"), Kind: c.QueryParam("kind")}
	if v := c.QueryParam("year"); v != "all" {
		p.Year = travelNow().Year()
		if v != "" {
			n, e := strconv.Atoi(v)
			if e != nil || n < 1900 || n > 9999 {
				return p, echo.NewHTTPError(http.StatusBadRequest, "tahun tidak valid")
			}
			p.Year = n
		}
	}
	for key, target := range map[string]*int64{"subkegiatan_id": &p.SubkegiatanID, "kab_kota_id": &p.KabKotaID, "activity_execution_id": &p.ActivityExecutionID} {
		if v := c.QueryParam(key); v != "" {
			n, e := strconv.ParseInt(v, 10, 64)
			if e != nil || n <= 0 {
				return p, echo.NewHTTPError(http.StatusBadRequest, key+" tidak valid")
			}
			*target = n
		}
	}
	return p, nil
}
func (a *ActivityController) Options(c echo.Context) error {
	options, e := a.travel.Options(c.Request().Context())
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, options)
}
func (a *ActivityController) List(c echo.Context) error {
	p, e := activityParams(c)
	if e != nil {
		return e
	}
	items, e := a.store.List(c.Request().Context(), p)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, items)
}
func (a *ActivityController) Detail(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	item, e := a.store.Detail(c.Request().Context(), id)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, item)
}
func (a *ActivityController) Save(c echo.Context) error {
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	var id int64
	if c.Param("id") != "" {
		id, e = travelID(c)
		if e != nil {
			return e
		}
	}
	var p model.ActivityExecutionPayload
	if e := c.Bind(&p); e != nil {
		return echo.NewHTTPError(400, "payload kegiatan tidak valid")
	}
	item, e := a.store.Save(c.Request().Context(), id, p, user)
	if e != nil {
		return activityHTTPError(e)
	}
	status := 200
	if id == 0 {
		status = 201
	}
	return jsonData(c, status, item)
}
func (a *ActivityController) Delete(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	if e := a.store.Delete(c.Request().Context(), id); e != nil {
		return activityHTTPError(e)
	}
	return c.NoContent(204)
}
func (a *ActivityController) Documents(c echo.Context) error {
	p, e := activityParams(c)
	if e != nil {
		return e
	}
	items, e := a.store.Documents(c.Request().Context(), p)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, items)
}
func (a *ActivityController) Document(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	item, e := a.store.Document(c.Request().Context(), id)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, item)
}
func (a *ActivityController) Template(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	item, e := a.store.Template(c.Request().Context(), id, c.Param("kind"))
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, item)
}
func (a *ActivityController) SaveDocument(c echo.Context) error {
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	var id int64
	if c.Param("id") != "" {
		id, e = travelID(c)
		if e != nil {
			return e
		}
	}
	var p model.ActivityDocumentPayload
	if e := c.Bind(&p); e != nil {
		return echo.NewHTTPError(400, "payload dokumen tidak valid")
	}
	item, e := a.store.SaveDocument(c.Request().Context(), id, p, user)
	if e != nil {
		return activityHTTPError(e)
	}
	status := 200
	if id == 0 {
		status = 201
	}
	return jsonData(c, status, item)
}
func (a *ActivityController) TransitionDocument(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	var p struct {
		Reason string `json:"reason"`
	}
	action := c.Param("action")
	if action == "cancel" {
		if e := c.Bind(&p); e != nil {
			return echo.NewHTTPError(400, "alasan pembatalan tidak valid")
		}
	}
	item, e := a.store.TransitionDocument(c.Request().Context(), id, user, action, p.Reason)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, item)
}
func (a *ActivityController) DeleteDocument(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	if e := a.store.DeleteDocument(c.Request().Context(), id); e != nil {
		return activityHTTPError(e)
	}
	return c.NoContent(204)
}
func (a *ActivityController) LinkTravel(c echo.Context) error {
	if c.Param("kind") != "assignment-letters" {
		return echo.NewHTTPError(404, "jenis dokumen tidak ditemukan")
	}
	id, e := travelID(c)
	if e != nil {
		return e
	}
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	var p struct {
		ActivityExecutionID int64 `json:"activityExecutionId"`
	}
	if e := c.Bind(&p); e != nil || p.ActivityExecutionID <= 0 {
		return echo.NewHTTPError(400, "kegiatan wajib dipilih")
	}
	item, e := a.travel.LinkActivity(c.Request().Context(), id, p.ActivityExecutionID, user)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, item)
}
func (a *ActivityController) Attachments(c echo.Context) error {
	p, e := activityParams(c)
	if e != nil {
		return e
	}
	if p.Kind != "" && p.Kind != "photo" && p.Kind != "support" {
		return echo.NewHTTPError(400, "jenis lampiran tidak valid")
	}
	items, e := a.store.Attachments(c.Request().Context(), p.ActivityExecutionID, p.Kind)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, items)
}
func (a *ActivityController) Upload(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	activity, e := a.store.Execution(c.Request().Context(), id)
	if e != nil {
		return activityHTTPError(e)
	}
	if activity.Status == "Dibatalkan" {
		return echo.NewHTTPError(409, "kegiatan sudah dibatalkan")
	}
	p := model.ActivityAttachmentPayload{Kind: c.FormValue("kind"), Category: c.FormValue("category"), Caption: c.FormValue("caption"), TakenAt: c.FormValue("takenAt"), LocationDescription: c.FormValue("locationDescription")}
	if e := repository.ValidateActivityAttachment(p); e != nil {
		return activityHTTPError(e)
	}
	header, e := c.FormFile("file")
	if e != nil {
		return echo.NewHTTPError(400, "file wajib diunggah")
	}
	if a.files == nil {
		return echo.NewHTTPError(500, "penyimpanan belum dikonfigurasi")
	}
	kind := fileasset.KindActivityAttachment
	if p.Kind == "photo" {
		kind = fileasset.KindAny
	}
	input, e := a.files.Save(c.Request().Context(), fileasset.SaveRequest{Header: header, Kind: kind, Visibility: model.FileVisibilityPrivate, Module: "activity-execution", RelatedType: "activity_attachment", Category: p.Category, StorageCategory: p.Kind, Year: strconv.Itoa(activity.FiscalYear), UploadedBy: &user})
	if e != nil {
		return managedUploadHTTPError(e)
	}
	item, e := a.store.AddAttachment(c.Request().Context(), id, p, input, user)
	if e != nil {
		deleteManagedStoredFile(c, a.files, input.StorageKey)
		return activityHTTPError(e)
	}
	return jsonData(c, http.StatusCreated, item)
}
func (a *ActivityController) UpdateAttachment(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	var p model.ActivityAttachmentPayload
	if e := c.Bind(&p); e != nil {
		return echo.NewHTTPError(400, "payload lampiran tidak valid")
	}
	item, e := a.store.UpdateAttachment(c.Request().Context(), id, p, user)
	if e != nil {
		return activityHTTPError(e)
	}
	return jsonData(c, 200, item)
}
func (a *ActivityController) DeleteAttachment(c echo.Context) error {
	id, e := travelID(c)
	if e != nil {
		return e
	}
	user, e := travelUser(c)
	if e != nil {
		return e
	}
	key, e := a.store.DeleteAttachment(c.Request().Context(), id, user)
	if e != nil {
		return activityHTTPError(e)
	}
	deleteManagedStoredFile(c, a.files, key)
	return c.NoContent(204)
}
