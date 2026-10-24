package fileasset

import (
	"archive/zip"
	"encoding/xml"
	"io"
	"mime/multipart"
	"strings"
)

const wordMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const excelMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

// Validate the OOXML package, not just the ZIP signature or client MIME.
func inspectOffice(header *multipart.FileHeader) (string, error) {
	source, e := header.Open()
	if e != nil {
		return "", e
	}
	defer source.Close()
	reader, e := zip.NewReader(source, header.Size)
	if e != nil {
		return "", ErrUnsupported
	}
	if len(reader.File) > 5000 {
		return "", ErrUnsupported
	}
	names := map[string]bool{}
	var total uint64
	var types *zip.File
	for _, f := range reader.File {
		if names[f.Name] || strings.HasPrefix(f.Name, "/") || strings.Contains(f.Name, "../") || f.Flags&1 != 0 {
			return "", ErrUnsupported
		}
		names[f.Name] = true
		total += f.UncompressedSize64
		if total > 200*1024*1024 {
			return "", ErrTooLarge
		}
		if strings.Contains(strings.ToLower(f.Name), "vbaproject") {
			return "", ErrUnsupported
		}
		if f.Name == "[Content_Types].xml" {
			types = f
		}
	}
	if types == nil || !names["_rels/.rels"] || types.UncompressedSize64 > 128*1024 {
		return "", ErrUnsupported
	}
	stream, e := types.Open()
	if e != nil {
		return "", ErrUnsupported
	}
	defer stream.Close()
	var data struct {
		Overrides []struct {
			PartName    string `xml:"PartName,attr"`
			ContentType string `xml:"ContentType,attr"`
		} `xml:"Override"`
	}
	if e := xml.NewDecoder(io.LimitReader(stream, 128*1024)).Decode(&data); e != nil {
		return "", ErrUnsupported
	}
	result := ""
	for _, v := range data.Overrides {
		if strings.Contains(strings.ToLower(v.ContentType), "macroenabled") {
			return "", ErrUnsupported
		}
		if v.PartName == "/word/document.xml" && v.ContentType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml" && names["word/document.xml"] {
			if result != "" {
				return "", ErrUnsupported
			}
			result = wordMime
		}
		if v.PartName == "/xl/workbook.xml" && v.ContentType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" && names["xl/workbook.xml"] {
			if result != "" {
				return "", ErrUnsupported
			}
			result = excelMime
		}
	}
	if result == "" {
		return "", ErrUnsupported
	}
	return result, nil
}
