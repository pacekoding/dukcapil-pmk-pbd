package repository

import (
	"testing"

	"dukcapil-pbd-be/internal/model"
)

func TestFinalizeOptimaInfoDetailUsesFileIDs(t *testing.T) {
	thumbnailID := int64(101)
	attachmentID := int64(102)

	detail := model.OptimaInfoDetail{
		ID:               12,
		Slug:             "info-test",
		ThumbnailFileID:  &thumbnailID,
		AttachmentFileID: &attachmentID,
	}

	finalizeOptimaInfoDetail(&detail, optimaInfoAdminAssetBuilder)

	if detail.ThumbnailURL != "/api/backend/files/101/preview" {
		t.Fatalf("ThumbnailURL = %q", detail.ThumbnailURL)
	}
	if detail.AttachmentDownloadURL != "/api/backend/files/102/download" {
		t.Fatalf("AttachmentDownloadURL = %q", detail.AttachmentDownloadURL)
	}
}

func TestFinalizeOptimaInfoSummariesUsesPublicFileIDs(t *testing.T) {
	thumbnailID := int64(201)
	attachmentID := int64(202)
	items := []model.OptimaInfoSummary{
		{
			ID:               22,
			Slug:             "info-summary",
			ThumbnailFileID:  &thumbnailID,
			AttachmentFileID: &attachmentID,
		},
	}

	finalizeOptimaInfoSummaries(items, optimaInfoPublicAssetBuilder)

	if items[0].ThumbnailURL != "/api/backend/website/files/201/preview" {
		t.Fatalf("ThumbnailURL = %q", items[0].ThumbnailURL)
	}
	if items[0].AttachmentDownloadURL != "/api/backend/website/files/202/download" {
		t.Fatalf("AttachmentDownloadURL = %q", items[0].AttachmentDownloadURL)
	}
}

func TestFinalizeOptimaInfoDetailPublishesLegacyOpInfoStorage(t *testing.T) {
	detail := model.OptimaInfoDetail{
		ID:                  33,
		Slug:                "legacy-info",
		ThumbnailStorageURL: "/uploads/op_info/thumbnail/legacy.jpg",
	}

	finalizeOptimaInfoDetail(&detail, optimaInfoAdminAssetBuilder)

	if detail.ThumbnailURL != "/api/backend/optima-info/33/thumbnail" {
		t.Fatalf("ThumbnailURL = %q, want admin thumbnail endpoint", detail.ThumbnailURL)
	}
}

func TestFinalizeOptimaInfoDetailNormalizesLegacyAPIURL(t *testing.T) {
	detail := model.OptimaInfoDetail{
		ID:                   44,
		Slug:                 "legacy-api",
		ThumbnailStorageURL:  "http://backend:8080/api/v1/op_info/44/thumbnail",
		AttachmentStorageURL: "/api/backend/op_info/44/attachment",
	}

	finalizeOptimaInfoDetail(&detail, optimaInfoAdminAssetBuilder)

	if detail.ThumbnailURL != "/api/backend/optima-info/44/thumbnail" {
		t.Fatalf("ThumbnailURL = %q", detail.ThumbnailURL)
	}
	if detail.AttachmentDownloadURL != "/api/backend/optima-info/44/attachment" {
		t.Fatalf("AttachmentDownloadURL = %q", detail.AttachmentDownloadURL)
	}
}
