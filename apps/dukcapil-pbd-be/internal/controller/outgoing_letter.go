package controller

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	authmiddleware "dukcapil-pbd-be/internal/middleware"
	"dukcapil-pbd-be/internal/model"

	"github.com/labstack/echo"
)

type OutgoingLetterStore interface {
	List(ctx context.Context, filter model.OutgoingLetterListFilter) (model.OutgoingLetterListResponse, error)
	Detail(ctx context.Context, id int64) (model.OutgoingLetter, bool, error)
	Create(ctx context.Context, payload model.OutgoingLetterPayload, userID int64) (model.OutgoingLetter, error)
	Update(ctx context.Context, id int64, payload model.OutgoingLetterPayload, userID int64) (model.OutgoingLetter, bool, error)
	Delete(ctx context.Context, id int64) (bool, error)
}

type OutgoingLetterController struct {
	letters OutgoingLetterStore
}

func NewOutgoingLetterController(letters OutgoingLetterStore) *OutgoingLetterController {
	return &OutgoingLetterController{letters: letters}
}

func (o *OutgoingLetterController) List(c echo.Context) error {
	response, err := o.letters.List(c.Request().Context(), outgoingLetterFilter(c))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "surat keluar gagal dimuat")
	}

	return jsonData(c, http.StatusOK, response)
}

func (o *OutgoingLetterController) Detail(c echo.Context) error {
	id, err := outgoingLetterID(c)
	if err != nil {
		return err
	}

	item, found, err := o.letters.Detail(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "surat keluar gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "surat keluar tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (o *OutgoingLetterController) Create(c echo.Context) error {
	var payload model.OutgoingLetterPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload surat keluar tidak valid")
	}
	if err := validateOutgoingLetterPayload(payload); err != nil {
		return err
	}

	item, err := o.letters.Create(c.Request().Context(), payload, currentUserID(c))
	if err != nil {
		return outgoingLetterSaveError(err)
	}

	return jsonData(c, http.StatusCreated, item)
}

func (o *OutgoingLetterController) Update(c echo.Context) error {
	id, err := outgoingLetterID(c)
	if err != nil {
		return err
	}

	var payload model.OutgoingLetterPayload
	if err := c.Bind(&payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "payload surat keluar tidak valid")
	}
	if err := validateOutgoingLetterPayload(payload); err != nil {
		return err
	}

	item, found, err := o.letters.Update(c.Request().Context(), id, payload, currentUserID(c))
	if err != nil {
		return outgoingLetterSaveError(err)
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "surat keluar tidak ditemukan")
	}

	return jsonData(c, http.StatusOK, item)
}

func (o *OutgoingLetterController) Delete(c echo.Context) error {
	id, err := outgoingLetterID(c)
	if err != nil {
		return err
	}

	found, err := o.letters.Delete(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "surat keluar gagal dihapus")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "surat keluar tidak ditemukan")
	}

	return c.NoContent(http.StatusNoContent)
}

func (o *OutgoingLetterController) Preview(c echo.Context) error {
	return o.Detail(c)
}

func (o *OutgoingLetterController) PDF(c echo.Context) error {
	id, err := outgoingLetterID(c)
	if err != nil {
		return err
	}

	item, found, err := o.letters.Detail(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "PDF surat keluar gagal dimuat")
	}
	if !found {
		return echo.NewHTTPError(http.StatusNotFound, "surat keluar tidak ditemukan")
	}

	filename := sanitizeOutgoingLetterFilename(item.LetterNumber, item.LetterDate)
	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf(`attachment; filename="%s"`, filename))
	return c.Blob(http.StatusOK, "application/pdf", renderOutgoingLetterPDF(item))
}

func outgoingLetterFilter(c echo.Context) model.OutgoingLetterListFilter {
	page, _ := strconv.Atoi(strings.TrimSpace(c.QueryParam("page")))
	limit, _ := strconv.Atoi(strings.TrimSpace(c.QueryParam("limit")))

	return model.OutgoingLetterListFilter{
		Query:      strings.TrimSpace(c.QueryParam("q")),
		Status:     model.OutgoingLetterStatus(strings.TrimSpace(c.QueryParam("status"))),
		LetterType: model.OutgoingLetterType(strings.TrimSpace(c.QueryParam("letterType"))),
		Year:       strings.TrimSpace(c.QueryParam("year")),
		Page:       page,
		Limit:      limit,
	}
}

func outgoingLetterID(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "parameter id tidak valid")
	}
	return id, nil
}

func validateOutgoingLetterPayload(payload model.OutgoingLetterPayload) error {
	if !payload.LetterType.Valid() {
		return echo.NewHTTPError(http.StatusBadRequest, "jenis surat tidak valid")
	}
	if !payload.Classification.Valid() {
		return echo.NewHTTPError(http.StatusBadRequest, "klasifikasi surat tidak valid")
	}
	if !payload.Status.Valid() {
		return echo.NewHTTPError(http.StatusBadRequest, "status surat tidak valid")
	}
	if strings.TrimSpace(payload.LetterDate) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "tanggal surat wajib diisi")
	}
	if payload.Status == model.OutgoingLetterStatusDraft {
		return nil
	}
	if strings.TrimSpace(payload.LetterNumber) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "nomor surat wajib diisi untuk status selesai")
	}
	if strings.TrimSpace(payload.Recipient) == "" || strings.TrimSpace(payload.ToText) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "tujuan surat wajib diisi")
	}
	if strings.TrimSpace(payload.OpeningText) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "pembukaan radiogram wajib diisi")
	}
	if strings.TrimSpace(payload.SectionAAA.Agenda) == "" || strings.TrimSpace(payload.SectionAAA.Location) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "bagian AAA wajib diisi lengkap")
	}
	if strings.TrimSpace(payload.SectionBBB) == "" || strings.TrimSpace(payload.SectionCCC) == "" || strings.TrimSpace(payload.SectionDDD) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "bagian BBB, CCC, dan DDD wajib diisi")
	}
	if strings.TrimSpace(payload.SignatoryName) == "" || strings.TrimSpace(payload.SignatoryPosition) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "penandatangan wajib diisi")
	}
	return nil
}

func currentUserID(c echo.Context) int64 {
	claims, ok := authmiddleware.ClaimsFromContext(c)
	if !ok {
		return 0
	}
	return claims.UserID
}

func outgoingLetterSaveError(err error) error {
	if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
		return echo.NewHTTPError(http.StatusConflict, "nomor surat sudah digunakan")
	}
	if strings.Contains(err.Error(), "tanggal surat tidak valid") {
		return echo.NewHTTPError(http.StatusBadRequest, "tanggal surat tidak valid")
	}
	return echo.NewHTTPError(http.StatusInternalServerError, "surat keluar gagal disimpan")
}

func sanitizeOutgoingLetterFilename(letterNumber string, letterDate string) string {
	safeNumber := strings.TrimSpace(letterNumber)
	if safeNumber == "" {
		safeNumber = "tanpa-nomor"
	}
	safeNumber = strings.Map(func(r rune) rune {
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' {
			return r
		}
		return '-'
	}, safeNumber)
	return fmt.Sprintf("radiogram-%s-%s.pdf", safeNumber, letterDate)
}

func renderOutgoingLetterPDF(item model.OutgoingLetter) []byte {
	lines := []string{
		"PEMERINTAH PROVINSI PAPUA BARAT DAYA",
		"SEKRETARIAT DAERAH",
		"FORMULIR BERITA",
		"KLASIFIKASI: " + strings.ToUpper(string(item.Classification)),
		"NOMOR: " + item.LetterNumber,
		"DARI: " + item.FromText,
		"UNTUK: " + item.ToText,
		"PEMBUKAAN: " + item.OpeningText,
		"AAA TTK " + item.SectionAAA.Agenda,
		"HARI/TANGGAL : " + item.SectionAAA.Day + ", " + item.SectionAAA.Date,
		"WAKTU : " + item.SectionAAA.StartTime + " SAMPAI " + item.SectionAAA.EndTime,
		"TEMPAT : " + item.SectionAAA.Location,
		"BBB TTK " + item.SectionBBB,
		"CCC TTK " + item.SectionCCC,
		"DDD TTK " + item.SectionDDD,
		"TANGGAL SURAT: " + item.LetterDate,
		"PENANDATANGAN: " + item.SignatoryName,
		"JABATAN: " + item.SignatoryPosition,
		"NIP: " + item.SignatoryNIP,
	}

	return simplePDF(wrapPDFLines(lines, 95))
}

func wrapPDFLines(lines []string, limit int) []string {
	var wrapped []string
	for _, line := range lines {
		words := strings.Fields(line)
		current := ""
		for _, word := range words {
			if len([]rune(current+" "+word)) > limit {
				wrapped = append(wrapped, current)
				current = word
				continue
			}
			if current == "" {
				current = word
			} else {
				current += " " + word
			}
		}
		if current != "" {
			wrapped = append(wrapped, current)
		}
	}
	return wrapped
}

func simplePDF(lines []string) []byte {
	const linesPerPage = 46
	chunks := [][]string{}
	for start := 0; start < len(lines); start += linesPerPage {
		end := start + linesPerPage
		if end > len(lines) {
			end = len(lines)
		}
		chunks = append(chunks, lines[start:end])
	}
	if len(chunks) == 0 {
		chunks = append(chunks, []string{""})
	}

	objects := []string{"", ""}
	kids := make([]string, 0, len(chunks))
	for _, chunk := range chunks {
		pageObj := len(objects) + 1
		contentObj := pageObj + 1
		kids = append(kids, fmt.Sprintf("%d 0 R", pageObj))
		content := pdfContentStream(chunk)
		objects = append(objects,
			fmt.Sprintf("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents %d 0 R >>", contentObj),
			fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", len(content), content),
		)
	}
	objects[0] = "<< /Type /Catalog /Pages 2 0 R >>"
	objects[1] = fmt.Sprintf("<< /Type /Pages /Kids [%s] /Count %d >>", strings.Join(kids, " "), len(kids))

	var buf bytes.Buffer
	buf.WriteString("%PDF-1.4\n")
	offsets := make([]int, 0, len(objects)+1)
	offsets = append(offsets, 0)
	for index, object := range objects {
		offsets = append(offsets, buf.Len())
		buf.WriteString(fmt.Sprintf("%d 0 obj\n%s\nendobj\n", index+1, object))
	}
	xref := buf.Len()
	buf.WriteString(fmt.Sprintf("xref\n0 %d\n0000000000 65535 f \n", len(objects)+1))
	for _, offset := range offsets[1:] {
		buf.WriteString(fmt.Sprintf("%010d 00000 n \n", offset))
	}
	buf.WriteString(fmt.Sprintf("trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF", len(objects)+1, xref))
	return buf.Bytes()
}

func pdfContentStream(lines []string) string {
	var buf bytes.Buffer
	buf.WriteString("BT\n/F1 10 Tf\n50 790 Td\n14 TL\n")
	for _, line := range lines {
		buf.WriteString("(")
		buf.WriteString(escapePDFText(line))
		buf.WriteString(") Tj\nT*\n")
	}
	buf.WriteString("ET")
	return buf.String()
}

func escapePDFText(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	value = strings.ReplaceAll(value, "(", `\(`)
	value = strings.ReplaceAll(value, ")", `\)`)
	return value
}
