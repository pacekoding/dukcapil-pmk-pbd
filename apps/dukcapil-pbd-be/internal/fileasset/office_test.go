package fileasset

import (
	"archive/zip"
	"bytes"
	"context"
	"dukcapil-pbd-be/internal/model"
	"fmt"
	"testing"
)

func officePackage(t *testing.T, part, contentType string, macro bool) []byte {
	t.Helper()
	var b bytes.Buffer
	z := zip.NewWriter(&b)
	for n, s := range map[string]string{"[Content_Types].xml": fmt.Sprintf(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/%s" ContentType="%s"/></Types>`, part, contentType), "_rels/.rels": `<Relationships/>`, part: `<document/>`} {
		w, e := z.Create(n)
		if e != nil {
			t.Fatal(e)
		}
		w.Write([]byte(s))
	}
	if macro {
		w, _ := z.Create("word/vbaProject.bin")
		w.Write([]byte("macro"))
	}
	if e := z.Close(); e != nil {
		t.Fatal(e)
	}
	return b.Bytes()
}
func TestActivityOfficeUploads(t *testing.T) {
	for _, tc := range []struct{ name, ext, part, main, mime string }{{"word", "docx", "word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", wordMime}, {"excel", "xlsx", "xl/workbook.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml", excelMime}} {
		t.Run(tc.name, func(t *testing.T) {
			data := officePackage(t, tc.part, tc.main, false)
			s := newTestService(t, 1<<20)
			save := func(name string, data []byte, kind Kind) error {
				_, e := s.Save(context.Background(), SaveRequest{Header: multipartHeader(t, name, "application/octet-stream", data), Kind: kind, Visibility: model.FileVisibilityPrivate, Module: "activity-execution", RelatedType: "activity_attachment", Category: "Materi", Year: "2026"})
				return e
			}
			if e := save("materi."+tc.ext, data, KindActivityAttachment); e != nil {
				t.Fatal(e)
			}
			if e := save("materi."+tc.ext, data, KindAny); e == nil {
				t.Fatal("legacy upload policy expanded")
			}
			if e := save("fake.pdf", data, KindActivityAttachment); e == nil {
				t.Fatal("accepted mismatched extension")
			}
			if e := save("macro."+tc.ext, officePackage(t, tc.part, tc.main, true), KindActivityAttachment); e == nil {
				t.Fatal("accepted VBA")
			}
			if e := save("fake."+tc.ext, officePackage(t, "arbitrary.xml", "application/xml", false), KindActivityAttachment); e == nil {
				t.Fatal("accepted arbitrary ZIP")
			}
		})
	}
}
