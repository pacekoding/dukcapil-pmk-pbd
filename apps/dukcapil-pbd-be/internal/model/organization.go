package model

import "time"

type OrganizationKind string

const (
	OrganizationFields    OrganizationKind = "fields"
	OrganizationSections  OrganizationKind = "sections"
	OrganizationPositions OrganizationKind = "positions"
)

func (k OrganizationKind) Table() string {
	switch k {
	case OrganizationFields:
		return "organisasi_bidang"
	case OrganizationSections:
		return "organisasi_seksi"
	case OrganizationPositions:
		return "organisasi_jabatan"
	default:
		return ""
	}
}

type OrganizationPayload struct {
	Name     string `json:"name"`
	Code     string `json:"code"`
	IsActive bool   `json:"isActive"`
	BidangID *int64 `json:"bidangId"`
	SeksiID  *int64 `json:"seksiId"`
}

type OrganizationItem struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Code         string    `json:"code"`
	IsActive     bool      `json:"isActive"`
	BidangID     *int64    `json:"bidangId"`
	SeksiID      *int64    `json:"seksiId"`
	BidangName   string    `json:"bidangName"`
	SeksiName    string    `json:"seksiName"`
	SectionCount int64     `json:"sectionCount"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type OrganizationListParams struct {
	Search   string
	BidangID *int64
	SeksiID  *int64
	Active   *bool
}
