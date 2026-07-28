package model

import "time"

type OutgoingLetterType string

const OutgoingLetterTypeRadiogram OutgoingLetterType = "radiogram"

func (t OutgoingLetterType) Valid() bool {
	return t == OutgoingLetterTypeRadiogram
}

type OutgoingLetterStatus string

const (
	OutgoingLetterStatusDraft   OutgoingLetterStatus = "draft"
	OutgoingLetterStatusSelesai OutgoingLetterStatus = "selesai"
)

func (s OutgoingLetterStatus) Valid() bool {
	switch s {
	case OutgoingLetterStatusDraft, OutgoingLetterStatusSelesai:
		return true
	default:
		return false
	}
}

type OutgoingLetterClassification string

const (
	OutgoingLetterClassificationBiasa        OutgoingLetterClassification = "biasa"
	OutgoingLetterClassificationPenting      OutgoingLetterClassification = "penting"
	OutgoingLetterClassificationSegera       OutgoingLetterClassification = "segera"
	OutgoingLetterClassificationSangatSegera OutgoingLetterClassification = "sangat_segera"
)

func (c OutgoingLetterClassification) Valid() bool {
	switch c {
	case OutgoingLetterClassificationBiasa,
		OutgoingLetterClassificationPenting,
		OutgoingLetterClassificationSegera,
		OutgoingLetterClassificationSangatSegera:
		return true
	default:
		return false
	}
}

type OutgoingLetterSectionAAA struct {
	Agenda    string `json:"agenda"`
	Day       string `json:"day"`
	Date      string `json:"date"`
	StartTime string `json:"startTime"`
	EndTime   string `json:"endTime"`
	Location  string `json:"location"`
}

type OutgoingLetter struct {
	ID                int64                        `json:"id"`
	LetterType        OutgoingLetterType           `json:"letterType"`
	Classification    OutgoingLetterClassification `json:"classification"`
	LetterNumber      string                       `json:"letterNumber"`
	LetterDate        string                       `json:"letterDate"`
	Recipient         string                       `json:"recipient"`
	Subject           string                       `json:"subject"`
	OpeningText       string                       `json:"openingText"`
	SectionAAA        OutgoingLetterSectionAAA     `json:"sectionAAA"`
	SectionBBB        string                       `json:"sectionBBB"`
	SectionCCC        string                       `json:"sectionCCC"`
	SectionDDD        string                       `json:"sectionDDD"`
	SenderAgency      string                       `json:"senderAgency"`
	FromText          string                       `json:"fromText"`
	ToText            string                       `json:"toText"`
	CopyTo            []string                     `json:"copyTo"`
	SignatoryName     string                       `json:"signatoryName"`
	SignatoryPosition string                       `json:"signatoryPosition"`
	SignatoryRank     string                       `json:"signatoryRank"`
	SignatoryNIP      string                       `json:"signatoryNip"`
	Status            OutgoingLetterStatus         `json:"status"`
	CreatedBy         int64                        `json:"createdBy"`
	UpdatedBy         int64                        `json:"updatedBy"`
	CreatedAt         string                       `json:"createdAt"`
	UpdatedAt         string                       `json:"updatedAt"`
}

type OutgoingLetterPayload struct {
	LetterType        OutgoingLetterType           `json:"letterType"`
	Classification    OutgoingLetterClassification `json:"classification"`
	LetterNumber      string                       `json:"letterNumber"`
	LetterDate        string                       `json:"letterDate"`
	Recipient         string                       `json:"recipient"`
	Subject           string                       `json:"subject"`
	OpeningText       string                       `json:"openingText"`
	SectionAAA        OutgoingLetterSectionAAA     `json:"sectionAAA"`
	SectionBBB        string                       `json:"sectionBBB"`
	SectionCCC        string                       `json:"sectionCCC"`
	SectionDDD        string                       `json:"sectionDDD"`
	SenderAgency      string                       `json:"senderAgency"`
	FromText          string                       `json:"fromText"`
	ToText            string                       `json:"toText"`
	CopyTo            []string                     `json:"copyTo"`
	SignatoryName     string                       `json:"signatoryName"`
	SignatoryPosition string                       `json:"signatoryPosition"`
	SignatoryRank     string                       `json:"signatoryRank"`
	SignatoryNIP      string                       `json:"signatoryNip"`
	Status            OutgoingLetterStatus         `json:"status"`
}

type OutgoingLetterListFilter struct {
	Query      string
	Status     OutgoingLetterStatus
	LetterType OutgoingLetterType
	Year       string
	Page       int
	Limit      int
}

type OutgoingLetterListResponse struct {
	Items []OutgoingLetter `json:"items"`
	Total int64            `json:"total"`
	Page  int              `json:"page"`
	Limit int              `json:"limit"`
}

type OutgoingLetterEntity struct {
	ID                int64                        `gorm:"primaryKey;column:id"`
	LetterType        OutgoingLetterType           `gorm:"column:letter_type"`
	Classification    OutgoingLetterClassification `gorm:"column:classification"`
	LetterNumber      string                       `gorm:"column:letter_number"`
	LetterDate        time.Time                    `gorm:"column:letter_date"`
	Recipient         string                       `gorm:"column:recipient"`
	Subject           string                       `gorm:"column:subject"`
	OpeningText       string                       `gorm:"column:opening_text"`
	SectionAAA        OutgoingLetterSectionAAA     `gorm:"column:section_aaa;type:jsonb;serializer:json"`
	SectionBBB        string                       `gorm:"column:section_bbb"`
	SectionCCC        string                       `gorm:"column:section_ccc"`
	SectionDDD        string                       `gorm:"column:section_ddd"`
	SenderAgency      string                       `gorm:"column:sender_agency"`
	FromText          string                       `gorm:"column:from_text"`
	ToText            string                       `gorm:"column:to_text"`
	CopyTo            []string                     `gorm:"column:copy_to;type:jsonb;serializer:json"`
	SignatoryName     string                       `gorm:"column:signatory_name"`
	SignatoryPosition string                       `gorm:"column:signatory_position"`
	SignatoryRank     string                       `gorm:"column:signatory_rank"`
	SignatoryNIP      string                       `gorm:"column:signatory_nip"`
	Status            OutgoingLetterStatus         `gorm:"column:status"`
	CreatedBy         int64                        `gorm:"column:created_by"`
	UpdatedBy         int64                        `gorm:"column:updated_by"`
	CreatedAt         time.Time                    `gorm:"column:created_at"`
	UpdatedAt         time.Time                    `gorm:"column:updated_at"`
}

func (OutgoingLetterEntity) TableName() string {
	return "outgoing_letters"
}

func (o OutgoingLetterEntity) ToOutgoingLetter() OutgoingLetter {
	return OutgoingLetter{
		ID:                o.ID,
		LetterType:        o.LetterType,
		Classification:    o.Classification,
		LetterNumber:      o.LetterNumber,
		LetterDate:        o.LetterDate.Format("2006-01-02"),
		Recipient:         o.Recipient,
		Subject:           o.Subject,
		OpeningText:       o.OpeningText,
		SectionAAA:        o.SectionAAA,
		SectionBBB:        o.SectionBBB,
		SectionCCC:        o.SectionCCC,
		SectionDDD:        o.SectionDDD,
		SenderAgency:      o.SenderAgency,
		FromText:          o.FromText,
		ToText:            o.ToText,
		CopyTo:            o.CopyTo,
		SignatoryName:     o.SignatoryName,
		SignatoryPosition: o.SignatoryPosition,
		SignatoryRank:     o.SignatoryRank,
		SignatoryNIP:      o.SignatoryNIP,
		Status:            o.Status,
		CreatedBy:         o.CreatedBy,
		UpdatedBy:         o.UpdatedBy,
		CreatedAt:         formatJSONTime(o.CreatedAt),
		UpdatedAt:         formatJSONTime(o.UpdatedAt),
	}
}
