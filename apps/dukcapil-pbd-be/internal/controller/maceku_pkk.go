package controller

import (
	"context"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"dukcapil-pbd-be/internal/fileasset"
	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"
	"dukcapil-pbd-be/internal/repository"
	"dukcapil-pbd-be/internal/security"

	"github.com/labstack/echo"
)

var (
	macekuYearPattern = regexp.MustCompile(`^\d{4}$`)
	emailPattern      = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
)

type MacekuPKKStore interface {
	List(ctx context.Context, params model.MacekuPKKProfileListParams) (model.MacekuPKKListResponse, error)
	Options(ctx context.Context, scope model.UserRegionScope) (model.MacekuPKKOptionsResponse, error)
	Detail(ctx context.Context, id int64, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, bool, error)
	Create(ctx context.Context, input model.MacekuPKKProfileMutation, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, error)
	Update(ctx context.Context, id int64, input model.MacekuPKKProfileMutation, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, bool, error)
	Delete(ctx context.Context, id int64, scope model.UserRegionScope) (model.MacekuPKKProfileDetail, bool, error)
	CreateArchive(ctx context.Context, payload model.MacekuPKKArchivePayload) (model.MacekuPKKArchive, error)
	ArchiveByID(ctx context.Context, profileID, archiveID int64) (model.MacekuPKKArchive, bool, error)
	UpdateArchive(ctx context.Context, profileID, archiveID int64, payload model.UpdateMacekuPKKArchivePayload) (model.MacekuPKKArchive, bool, error)
	DeleteArchive(ctx context.Context, profileID, archiveID int64) (model.MacekuPKKArchive, bool, error)
}

type MacekuPKKController struct {
	store MacekuPKKStore
	files *fileasset.Service
}

func NewMacekuPKKController(store MacekuPKKStore, files ...*fileasset.Service) *MacekuPKKController {
	var service *fileasset.Service
	if len(files) > 0 {
		service = files[0]
	}
	return &MacekuPKKController{store: store, files: service}
}

func (m *MacekuPKKController) List(c echo.Context) error {
	claims, err := macekuClaims(c)
	if err != nil {
		return err
	}
	if err := ensureMacekuScopeConfigured(claims); err != nil {
		return err
	}

	response, listErr := m.store.List(c.Request().Context(), model.MacekuPKKProfileListParams{
		Search:        c.QueryParam("search"),
		Level:         c.QueryParam("level"),
		KabupatenKota: firstNonEmptyQuery(c, "kabupatenKota", "kabupaten_kota"),
		Distrik:       c.QueryParam("distrik"),
		Kampung:       c.QueryParam("kampung"),
		Status:        c.QueryParam("status"),
		Page:          parsePositiveDocumentQueryInt(c.QueryParam("page"), 1),
		Limit:         parsePositiveDocumentQueryInt(c.QueryParam("limit"), 10),
		RegionScope:   claims.RegionScope,
	})
	if listErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "data profil PKK gagal dimuat")
	}
	return jsonData(c, http.StatusOK, response)
}

func (m *MacekuPKKController) Options(c echo.Context) error {
	claims, err := macekuClaims(c)
	if err != nil {
		return err
	}
	if err := ensureMacekuScopeConfigured(claims); err != nil {
		return err
	}

	response, optionsErr := m.store.Options(c.Request().Context(), claims.RegionScope)
	if optionsErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "opsi wilayah PKK gagal dimuat")
	}
	return jsonData(c, http.StatusOK, response)
}

func (m *MacekuPKKController) Detail(c echo.Context) error {
	profile, _, err := m.detailForScope(c)
	if err != nil {
		return err
	}
	return jsonData(c, http.StatusOK, profile)
}

func (m *MacekuPKKController) Logo(c echo.Context) error {
	profile, _, err := m.detailForScope(c)
	if err != nil {
		return err
	}
	if strings.TrimSpace(profile.LogoStorageURL) == "" {
		return echo.NewHTTPError(http.StatusNotFound, "logo profil tidak ditemukan")
	}
	return serveManagedStoredFile(
		c,
		m.files,
		profile.LogoStorageURL,
		profile.LogoMimeType,
		profile.LogoOriginalName,
		"inline",
		false,
	)
}

func (m *MacekuPKKController) Create(c echo.Context) error {
	claims, err := macekuClaims(c)
	if err != nil {
		return err
	}
	if err := ensureMacekuScopeConfigured(claims); err != nil {
		return err
	}

	payload, input, validationErr := parseMacekuProfileMutation(c, claims, m.files)
	if validationErr != nil {
		return validationErr
	}
	newLogoURL := input.LogoURL
	if accessErr := ensureMacekuScopeCanManage(claims, payload.KabupatenKota, payload.Distrik, payload.Kampung); accessErr != nil {
		deleteManagedStoredFile(c, m.files, newLogoURL)
		return accessErr
	}

	profile, createErr := m.store.Create(c.Request().Context(), input, claims.RegionScope)
	if createErr != nil {
		deleteManagedStoredFile(c, m.files, input.LogoURL)
		if errors.Is(createErr, repository.ErrMacekuPKKDuplicate) {
			return echo.NewHTTPError(http.StatusConflict, "profil PKK pada wilayah tersebut sudah ada")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "profil PKK gagal dibuat")
	}
	return jsonData(c, http.StatusCreated, profile)
}

func (m *MacekuPKKController) Update(c echo.Context) error {
	current, claims, err := m.detailForScope(c)
	if err != nil {
		return err
	}

	payload, input, validationErr := parseMacekuProfileMutation(c, claims, m.files)
	if validationErr != nil {
		return validationErr
	}
	newLogoURL := input.LogoURL
	if accessErr := ensureMacekuScopeCanManage(claims, payload.KabupatenKota, payload.Distrik, payload.Kampung); accessErr != nil {
		deleteManagedStoredFile(c, m.files, newLogoURL)
		return accessErr
	}
	if input.LogoURL == "" {
		input.LogoURL = current.LogoStorageURL
		input.LogoOriginalName = current.LogoOriginalName
		input.LogoMimeType = current.LogoMimeType
		input.LogoSize = current.LogoSize
	}

	id, idErr := macekuProfileID(c)
	if idErr != nil {
		deleteManagedStoredFile(c, m.files, newLogoURL)
		return idErr
	}

	updated, found, updateErr := m.store.Update(c.Request().Context(), id, input, claims.RegionScope)
	if updateErr != nil {
		deleteManagedStoredFile(c, m.files, newLogoURL)
		if errors.Is(updateErr, repository.ErrMacekuPKKDuplicate) {
			return echo.NewHTTPError(http.StatusConflict, "profil PKK pada wilayah tersebut sudah ada")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "profil PKK gagal diperbarui")
	}
	if !found {
		deleteManagedStoredFile(c, m.files, newLogoURL)
		return echo.NewHTTPError(http.StatusNotFound, "profil PKK tidak ditemukan")
	}
	if current.LogoStorageURL != "" && current.LogoStorageURL != input.LogoURL {
		deleteManagedStoredFile(c, m.files, current.LogoStorageURL)
	}
	return jsonData(c, http.StatusOK, updated)
}

func (m *MacekuPKKController) Delete(c echo.Context) error {
	profile, claims, err := m.detailForScope(c)
	if err != nil {
		return err
	}
	id, idErr := macekuProfileID(c)
	if idErr != nil {
		return idErr
	}

	deleted, found, deleteErr := m.store.Delete(c.Request().Context(), id, claims.RegionScope)
	if deleteErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "profil PKK gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "profil PKK tidak ditemukan")
	}
	if deleted.LogoStorageURL != "" {
		deleteManagedStoredFile(c, m.files, deleted.LogoStorageURL)
	}
	for _, archive := range profile.Archives {
		deleteManagedStoredFile(c, m.files, archive.StorageURL)
	}
	return c.NoContent(http.StatusNoContent)
}

func (m *MacekuPKKController) UploadArchive(c echo.Context) error {
	profile, claims, err := m.detailForScope(c)
	if err != nil {
		return err
	}

	file, uploadErr := saveMacekuArchiveUpload(c, m.files, claims)
	if uploadErr != nil {
		return uploadErr
	}
	payload, validationErr := parseMacekuArchivePayload(c, profile.ID, claims, file)
	if validationErr != nil {
		deleteManagedStoredFile(c, m.files, file.StorageKey)
		return validationErr
	}

	archive, createErr := m.store.CreateArchive(c.Request().Context(), payload)
	if createErr != nil {
		deleteManagedStoredFile(c, m.files, file.StorageKey)
		return echo.NewHTTPError(http.StatusInternalServerError, "arsip PKK gagal disimpan")
	}
	return jsonData(c, http.StatusCreated, archive)
}

func (m *MacekuPKKController) UpdateArchive(c echo.Context) error {
	profile, _, err := m.detailForScope(c)
	if err != nil {
		return err
	}
	archiveID, archiveErr := macekuArchiveID(c)
	if archiveErr != nil {
		return archiveErr
	}

	var payload model.UpdateMacekuPKKArchivePayload
	if bindErr := c.Bind(&payload); bindErr != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload arsip PKK tidak valid")
	}
	if validationErr := validateMacekuArchiveMetadata(&payload); validationErr != nil {
		return validationErr
	}

	archive, found, updateErr := m.store.UpdateArchive(c.Request().Context(), profile.ID, archiveID, payload)
	if updateErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "metadata arsip PKK gagal diperbarui")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "arsip PKK tidak ditemukan")
	}
	return jsonData(c, http.StatusOK, archive)
}

func (m *MacekuPKKController) DeleteArchive(c echo.Context) error {
	profile, _, err := m.detailForScope(c)
	if err != nil {
		return err
	}
	archiveID, archiveErr := macekuArchiveID(c)
	if archiveErr != nil {
		return archiveErr
	}

	archive, found, deleteErr := m.store.DeleteArchive(c.Request().Context(), profile.ID, archiveID)
	if deleteErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "arsip PKK gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "arsip PKK tidak ditemukan")
	}
	deleteManagedStoredFile(c, m.files, archive.StorageURL)
	return c.NoContent(http.StatusNoContent)
}

func (m *MacekuPKKController) DownloadArchive(c echo.Context) error {
	return m.serveArchive(c, "attachment")
}

func (m *MacekuPKKController) PreviewArchive(c echo.Context) error {
	return m.serveArchive(c, "inline")
}

func (m *MacekuPKKController) serveArchive(c echo.Context, disposition string) error {
	profile, _, err := m.detailForScope(c)
	if err != nil {
		return err
	}
	archiveID, archiveErr := macekuArchiveID(c)
	if archiveErr != nil {
		return archiveErr
	}

	archive, found, detailErr := m.store.ArchiveByID(c.Request().Context(), profile.ID, archiveID)
	if detailErr != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "arsip PKK gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "arsip PKK tidak ditemukan")
	}
	return serveManagedStoredFile(
		c,
		m.files,
		archive.StorageURL,
		archive.MimeType,
		archive.OriginalName,
		documentRequestDisposition(c, disposition),
		false,
	)
}

func (m *MacekuPKKController) detailForScope(c echo.Context) (model.MacekuPKKProfileDetail, security.Claims, error) {
	claims, err := macekuClaims(c)
	if err != nil {
		return model.MacekuPKKProfileDetail{}, security.Claims{}, err
	}
	if err := ensureMacekuScopeConfigured(claims); err != nil {
		return model.MacekuPKKProfileDetail{}, security.Claims{}, err
	}

	id, idErr := macekuProfileID(c)
	if idErr != nil {
		return model.MacekuPKKProfileDetail{}, security.Claims{}, idErr
	}
	profile, found, detailErr := m.store.Detail(c.Request().Context(), id, claims.RegionScope)
	if detailErr != nil {
		return model.MacekuPKKProfileDetail{}, security.Claims{}, echo.NewHTTPError(http.StatusInternalServerError, "detail profil PKK gagal dimuat")
	}
	if !found {
		return model.MacekuPKKProfileDetail{}, security.Claims{}, echo.NewHTTPError(http.StatusNotFound, "profil PKK tidak ditemukan")
	}
	if accessErr := ensureMacekuScopeCanManage(claims, profile.KabupatenKota, profile.Distrik, profile.Kampung); accessErr != nil {
		return model.MacekuPKKProfileDetail{}, security.Claims{}, accessErr
	}
	return profile, claims, nil
}

func parseMacekuProfileMutation(
	c echo.Context,
	claims security.Claims,
	files *fileasset.Service,
) (model.MacekuPKKProfilePayload, model.MacekuPKKProfileMutation, error) {
	payload := model.MacekuPKKProfilePayload{
		Name:               formOrJSONValue(c, "name"),
		KabupatenKota:      formOrJSONValue(c, "kabupatenKota", "kabupaten_kota"),
		Distrik:            formOrJSONValue(c, "distrik"),
		Kampung:            formOrJSONValue(c, "kampung"),
		SecretariatAddress: formOrJSONValue(c, "secretariatAddress", "secretariat_address"),
		Chairperson:        formOrJSONValue(c, "chairperson"),
		Secretary:          formOrJSONValue(c, "secretary"),
		Phone:              formOrJSONValue(c, "phone"),
		Email:              formOrJSONValue(c, "email"),
		ManagementPeriod:   formOrJSONValue(c, "managementPeriod", "management_period"),
		Description:        formOrJSONValue(c, "description"),
		IsActive:           parseDocumentBoolForm(formOrJSONValue(c, "isActive", "is_active")),
	}
	if c.Request().Header.Get(echo.HeaderContentType) == "application/json" {
		var request model.MacekuPKKProfilePayload
		if err := c.Bind(&request); err == nil {
			payload = request
		}
	}

	if err := validateMacekuProfilePayload(&payload); err != nil {
		return model.MacekuPKKProfilePayload{}, model.MacekuPKKProfileMutation{}, err
	}
	level := deriveMacekuPKKLevel(payload.KabupatenKota, payload.Distrik, payload.Kampung)
	logo, err := saveMacekuLogoUpload(c, files, claims, time.Now().Year())
	if err != nil {
		return model.MacekuPKKProfilePayload{}, model.MacekuPKKProfileMutation{}, err
	}

	var actorUserID *int64
	if claims.UserID > 0 {
		actorUserID = &claims.UserID
	}
	mutation := model.MacekuPKKProfileMutation{
		Payload:     payload,
		Level:       level,
		LogoFile:    logo,
		ActorUserID: actorUserID,
	}
	if logo != nil {
		mutation.LogoURL = logo.StorageKey
		mutation.LogoOriginalName = logo.OriginalFilename
		mutation.LogoMimeType = logo.MimeType
		mutation.LogoSize = logo.FileSize
	}
	return payload, mutation, nil
}

func parseMacekuArchivePayload(c echo.Context, profileID int64, claims security.Claims, file model.StoredFileInput) (model.MacekuPKKArchivePayload, error) {
	title := strings.TrimSpace(c.FormValue("title"))
	if title == "" {
		title = strings.TrimSpace(c.FormValue("judul"))
	}
	if title == "" {
		title = file.OriginalFilename
	}

	payload := model.MacekuPKKArchivePayload{
		ProfileID:      profileID,
		Title:          title,
		Category:       model.MacekuPKKArchiveCategory(strings.TrimSpace(c.FormValue("category"))),
		DocumentYear:   strings.TrimSpace(c.FormValue("documentYear")),
		DocumentNumber: strings.TrimSpace(c.FormValue("documentNumber")),
		Description:    strings.TrimSpace(c.FormValue("description")),
		File:           &file,
		FileURL:        file.StorageKey,
		OriginalName:   file.OriginalFilename,
		MimeType:       file.MimeType,
		Size:           file.FileSize,
		UploadedByName: claims.Name,
	}
	if payload.Category == "" {
		payload.Category = model.MacekuPKKArchiveLainnya
	}
	if claims.UserID > 0 {
		payload.UploadedByUserID = &claims.UserID
	}
	if value := strings.TrimSpace(c.FormValue("documentDate")); value != "" {
		parsed, err := time.Parse("2006-01-02", value)
		if err != nil {
			return model.MacekuPKKArchivePayload{}, echo.NewHTTPError(http.StatusBadRequest, "tanggal dokumen tidak valid")
		}
		payload.DocumentDate = &parsed
	}
	if err := validateMacekuArchivePayload(payload); err != nil {
		return model.MacekuPKKArchivePayload{}, err
	}
	return payload, nil
}

func validateMacekuProfilePayload(payload *model.MacekuPKKProfilePayload) error {
	payload.Name = strings.TrimSpace(payload.Name)
	payload.KabupatenKota = strings.TrimSpace(payload.KabupatenKota)
	payload.Distrik = strings.TrimSpace(payload.Distrik)
	payload.Kampung = strings.TrimSpace(payload.Kampung)
	payload.SecretariatAddress = strings.TrimSpace(payload.SecretariatAddress)
	payload.Chairperson = strings.TrimSpace(payload.Chairperson)
	payload.Secretary = strings.TrimSpace(payload.Secretary)
	payload.Phone = strings.TrimSpace(payload.Phone)
	payload.Email = strings.TrimSpace(payload.Email)
	payload.ManagementPeriod = strings.TrimSpace(payload.ManagementPeriod)
	payload.Description = strings.TrimSpace(payload.Description)

	if payload.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nama PKK wajib diisi")
	}
	if payload.KabupatenKota == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "kabupaten/kota wajib diisi")
	}
	if payload.Distrik == "" && payload.Kampung != "" {
		return echo.NewHTTPError(http.StatusBadRequest, "desa/kampung membutuhkan kecamatan/distrik")
	}
	if payload.Email != "" && !emailPattern.MatchString(payload.Email) {
		return echo.NewHTTPError(http.StatusBadRequest, "email tidak valid")
	}
	if strings.TrimSpace(payload.Phone) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nomor telepon wajib diisi")
	}
	return nil
}

func validateMacekuArchivePayload(payload model.MacekuPKKArchivePayload) error {
	if strings.TrimSpace(payload.Title) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "judul dokumen wajib diisi")
	}
	if !validMacekuArchiveCategory(payload.Category) {
		return echo.NewHTTPError(http.StatusBadRequest, "kategori arsip tidak valid")
	}
	if payload.DocumentYear != "" && !macekuYearPattern.MatchString(payload.DocumentYear) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun dokumen tidak valid")
	}
	return nil
}

func validateMacekuArchiveMetadata(payload *model.UpdateMacekuPKKArchivePayload) error {
	payload.Title = strings.TrimSpace(payload.Title)
	payload.DocumentYear = strings.TrimSpace(payload.DocumentYear)
	payload.DocumentNumber = strings.TrimSpace(payload.DocumentNumber)
	payload.DocumentDate = strings.TrimSpace(payload.DocumentDate)
	payload.Description = strings.TrimSpace(payload.Description)

	if payload.Title == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "judul dokumen wajib diisi")
	}
	if !validMacekuArchiveCategory(payload.Category) {
		return echo.NewHTTPError(http.StatusBadRequest, "kategori arsip tidak valid")
	}
	if payload.DocumentYear != "" && !macekuYearPattern.MatchString(payload.DocumentYear) {
		return echo.NewHTTPError(http.StatusBadRequest, "tahun dokumen tidak valid")
	}
	if payload.DocumentDate != "" {
		if _, err := time.Parse("2006-01-02", payload.DocumentDate); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "tanggal dokumen tidak valid")
		}
	}
	return nil
}

func validMacekuArchiveCategory(category model.MacekuPKKArchiveCategory) bool {
	switch category {
	case model.MacekuPKKArchiveProgramKerja,
		model.MacekuPKKArchiveLKPJ,
		model.MacekuPKKArchiveLaporanKegiatan,
		model.MacekuPKKArchiveSuratKeputusan,
		model.MacekuPKKArchiveKepengurusan,
		model.MacekuPKKArchiveAdministrasi,
		model.MacekuPKKArchiveDokumentasi,
		model.MacekuPKKArchiveLainnya:
		return true
	default:
		return false
	}
}

func deriveMacekuPKKLevel(kabupatenKota, distrik, kampung string) model.MacekuPKKLevel {
	if strings.TrimSpace(kampung) != "" {
		return model.MacekuPKKLevelKampung
	}
	if strings.TrimSpace(distrik) != "" {
		return model.MacekuPKKLevelDistrik
	}
	return model.MacekuPKKLevelKabupaten
}

func ensureMacekuScopeConfigured(claims security.Claims) error {
	if claims.Role == model.RoleSuperAdmin {
		return nil
	}
	if strings.TrimSpace(claims.RegionScope.KabupatenKota) == "" {
		return echo.NewHTTPError(http.StatusForbidden, "scope wilayah user untuk MACEKU PKK belum dikonfigurasi")
	}
	return nil
}

func ensureMacekuScopeCanManage(claims security.Claims, kabupatenKota, distrik, kampung string) error {
	if claims.Role == model.RoleSuperAdmin {
		return nil
	}

	scope := claims.RegionScope
	if !strings.EqualFold(strings.TrimSpace(scope.KabupatenKota), strings.TrimSpace(kabupatenKota)) {
		return echo.NewHTTPError(http.StatusForbidden, "user tidak diizinkan mengakses wilayah tersebut")
	}
	if strings.TrimSpace(scope.Distrik) != "" && !strings.EqualFold(strings.TrimSpace(scope.Distrik), strings.TrimSpace(distrik)) {
		return echo.NewHTTPError(http.StatusForbidden, "user tidak diizinkan mengakses distrik tersebut")
	}
	if strings.TrimSpace(scope.Kampung) != "" && !strings.EqualFold(strings.TrimSpace(scope.Kampung), strings.TrimSpace(kampung)) {
		return echo.NewHTTPError(http.StatusForbidden, "user tidak diizinkan mengakses kampung tersebut")
	}
	return nil
}

func macekuClaims(c echo.Context) (security.Claims, error) {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return security.Claims{}, echo.NewHTTPError(http.StatusUnauthorized, "session login tidak valid")
	}
	return claims, nil
}

func macekuProfileID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}
	return id, nil
}

func macekuArchiveID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("archive_id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter archive_id tidak valid")
	}
	return id, nil
}

func firstNonEmptyQuery(c echo.Context, keys ...string) string {
	for _, key := range keys {
		value := strings.TrimSpace(c.QueryParam(key))
		if value != "" {
			return value
		}
	}
	return ""
}

func formOrJSONValue(c echo.Context, keys ...string) string {
	for _, key := range keys {
		value := strings.TrimSpace(c.FormValue(key))
		if value != "" {
			return value
		}
	}
	return ""
}

func saveMacekuArchiveUpload(
	c echo.Context,
	files *fileasset.Service,
	claims security.Claims,
) (model.StoredFileInput, error) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return model.StoredFileInput{}, echo.NewHTTPError(http.StatusBadRequest, "file arsip wajib diunggah")
	}
	if files == nil {
		return model.StoredFileInput{}, echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}

	category := model.MacekuPKKArchiveCategory(strings.TrimSpace(c.FormValue("category")))
	if category == "" {
		category = model.MacekuPKKArchiveLainnya
	}
	if !validMacekuArchiveCategory(category) {
		return model.StoredFileInput{}, echo.NewHTTPError(http.StatusBadRequest, "kategori arsip tidak valid")
	}
	year := strings.TrimSpace(c.FormValue("documentYear"))
	if year == "" {
		year = strconv.Itoa(time.Now().Year())
	}
	if !macekuYearPattern.MatchString(year) {
		return model.StoredFileInput{}, echo.NewHTTPError(http.StatusBadRequest, "tahun dokumen tidak valid")
	}

	file, err := files.Save(c.Request().Context(), fileasset.SaveRequest{
		Header:          fileHeader,
		Kind:            fileasset.KindAny,
		Visibility:      model.FileVisibilityPrivate,
		Module:          "maceku-pkk",
		RelatedType:     "maceku_pkk_archive",
		Category:        macekuArchiveStorageCategory(category),
		StorageCategory: macekuArchiveStorageCategory(category),
		Year:            year,
		UploadedBy:      &claims.UserID,
	})
	if err != nil {
		return model.StoredFileInput{}, managedUploadHTTPError(err)
	}
	return file, nil
}

func saveMacekuLogoUpload(
	c echo.Context,
	files *fileasset.Service,
	claims security.Claims,
	year int,
) (*model.StoredFileInput, error) {
	fileHeader, err := c.FormFile("logo")
	if err != nil {
		return nil, nil
	}
	if files == nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "storage file belum dikonfigurasi")
	}
	file, err := files.Save(c.Request().Context(), fileasset.SaveRequest{
		Header:          fileHeader,
		Kind:            fileasset.KindImage,
		Visibility:      model.FileVisibilityPrivate,
		Module:          "maceku-pkk",
		RelatedType:     "maceku_pkk_profile",
		Category:        "logo",
		StorageCategory: "kepengurusan",
		Year:            strconv.Itoa(year),
		UploadedBy:      &claims.UserID,
	})
	if err != nil {
		return nil, managedUploadHTTPError(err)
	}
	return &file, nil
}

func macekuArchiveStorageCategory(category model.MacekuPKKArchiveCategory) string {
	switch category {
	case model.MacekuPKKArchiveProgramKerja:
		return "program-kerja"
	case model.MacekuPKKArchiveLKPJ:
		return "lkpj"
	case model.MacekuPKKArchiveLaporanKegiatan:
		return "laporan-kegiatan"
	case model.MacekuPKKArchiveSuratKeputusan:
		return "sk"
	case model.MacekuPKKArchiveKepengurusan:
		return "kepengurusan"
	default:
		return "lainnya"
	}
}
