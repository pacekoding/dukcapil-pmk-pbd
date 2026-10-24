package model

import (
	"database/sql/driver"
	"fmt"
	"time"
)

type TravelDate string

func (d *TravelDate) Scan(value any) error {
	switch v := value.(type) {
	case time.Time:
		*d = TravelDate(v.Format("2006-01-02"))
	case string:
		if len(v) >= 10 {
			*d = TravelDate(v[:10])
		} else {
			*d = TravelDate(v)
		}
	case []byte:
		return d.Scan(string(v))
	default:
		return fmt.Errorf("invalid travel date")
	}
	return nil
}
func (d TravelDate) Value() (driver.Value, error) { return string(d), nil }

type TravelOffice struct {
	GovernmentName string `json:"governmentName"`
	ProvinceName   string `json:"provinceName"`
	AgencyName     string `json:"agencyName"`
	Address        string `json:"address"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	Website        string `json:"website"`
	Logo           string `json:"logo"`
}

func DefaultTravelOffice() TravelOffice {
	return TravelOffice{
		GovernmentName: "PEMERINTAH PROVINSI PAPUA BARAT DAYA", ProvinceName: "Papua Barat Daya",
		AgencyName: "DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL DAN PEMBERDAYAAN MASYARAKAT DAN KAMPUNG",
		Address:    "Kantor Gubernur Papua Barat Daya, Kota Sorong, Papua Barat Daya",
		Email:      "dukcapilpmk@papuabaratdaya.go.id", Logo: "/logo-pbd.png",
	}
}

type TravelPerson struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	NIP      string `json:"nip" gorm:"column:nip"`
	Rank     string `json:"rank"`
	Position string `json:"position"`
	Bidang   string `json:"bidang"`
	Unit     string `json:"unit"`
	Status   string `json:"status"`
}

type TravelAudit struct {
	Status             string     `json:"status"`
	CreatedBy          int64      `json:"createdBy"`
	UpdatedBy          int64      `json:"updatedBy"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
	FinalizedAt        *time.Time `json:"finalizedAt"`
	FinalizedBy        *int64     `json:"finalizedBy"`
	CancelledAt        *time.Time `json:"cancelledAt"`
	CancelledBy        *int64     `json:"cancelledBy"`
	CancellationReason string     `json:"cancellationReason"`
}

type TravelAssignmentPayload struct {
	ActivityExecutionID *int64     `json:"activityExecutionId"`
	Number              string     `json:"number"`
	DocumentDate        TravelDate `json:"documentDate" gorm:"type:date"`
	IssuePlace          string     `json:"issuePlace"`
	Bases               []string   `json:"bases" gorm:"serializer:json;type:jsonb"`
	Instructions        []string   `json:"instructions" gorm:"serializer:json;type:jsonb"`
	EmployeeIDs         []int64    `json:"employeeIds" gorm:"-"`
	Origin              string     `json:"origin"`
	Destination         string     `json:"destination"`
	DepartureDate       TravelDate `json:"departureDate" gorm:"type:date"`
	ReturnDate          TravelDate `json:"returnDate" gorm:"type:date"`
	TripType            string     `json:"tripType"`
	Transport           string     `json:"transport"`
	SignerID            int64      `json:"signerId"`
}

type TravelAssignmentSnapshot struct {
	Activity  *ActivityExecution `json:"activity"`
	Office    TravelOffice       `json:"office"`
	Employees []TravelPerson     `json:"employees"`
	Signer    TravelPerson       `json:"signer"`
}

type TravelAssignment struct {
	Activity                *ActivityExecution `json:"activity" gorm:"-"`
	ID                      int64              `json:"id" gorm:"primaryKey"`
	TravelAssignmentPayload `gorm:"embedded"`
	TravelAudit             `gorm:"embedded"`
	Snapshot                *TravelAssignmentSnapshot `json:"snapshot" gorm:"serializer:json;type:jsonb"`
	Employees               []TravelPerson            `json:"employees" gorm:"-"`
	Signer                  TravelPerson              `json:"signer" gorm:"-"`
	Office                  TravelOffice              `json:"office" gorm:"-"`
	DurationDays            int                       `json:"durationDays" gorm:"-"`
}

func (TravelAssignment) TableName() string { return "surat_tugas" }

type TravelAssignmentMember struct {
	AssignmentLetterID int64 `gorm:"primaryKey"`
	EmployeeID         int64 `gorm:"primaryKey"`
	SortOrder          int
}

func (TravelAssignmentMember) TableName() string { return "surat_tugas_pelaksana" }

type TravelFollower struct {
	Name        string `json:"name"`
	BirthDate   string `json:"birthDate"`
	Description string `json:"description"`
}

type TravelApproval struct {
	ArrivalPlace             string `json:"arrivalPlace"`
	ArrivalDate              string `json:"arrivalDate"`
	DeparturePlace           string `json:"departurePlace"`
	Destination              string `json:"destination"`
	DepartureDate            string `json:"departureDate"`
	ArrivalOfficerName       string `json:"arrivalOfficerName"`
	ArrivalOfficerNIP        string `json:"arrivalOfficerNip" gorm:"column:arrival_officer_nip"`
	ArrivalOfficerPosition   string `json:"arrivalOfficerPosition"`
	DepartureOfficerName     string `json:"departureOfficerName"`
	DepartureOfficerNIP      string `json:"departureOfficerNip"`
	DepartureOfficerPosition string `json:"departureOfficerPosition"`
}

type TravelOrderPayload struct {
	ActivityExecutionID   *int64           `json:"activityExecutionId"`
	AssignmentLetterID    int64            `json:"assignmentLetterId"`
	EmployeeID            int64            `json:"employeeId"`
	Number                string           `json:"number"`
	SheetNumber           string           `json:"sheetNumber"`
	Code                  string           `json:"code"`
	DocumentDate          TravelDate       `json:"documentDate" gorm:"type:date"`
	IssuePlace            string           `json:"issuePlace"`
	SignerID              int64            `json:"signerId"`
	SignerRole            string           `json:"signerRole"`
	ExpenseLevel          string           `json:"expenseLevel"`
	Followers             []TravelFollower `json:"followers" gorm:"serializer:json;type:jsonb"`
	Approvals             []TravelApproval `json:"approvals" gorm:"serializer:json;type:jsonb"`
	SKPD                  string           `json:"skpd" gorm:"column:skpd"`
	SubkegiatanID         *int64           `json:"subkegiatanId"`
	AccountCode           string           `json:"accountCode"`
	FundingSource         string           `json:"fundingSource"`
	FiscalYear            int              `json:"fiscalYear"`
	Notes                 string           `json:"notes"`
	ReturnedPlace         string           `json:"returnedPlace"`
	ReturnedDate          string           `json:"returnedDate"`
	ReturnOfficerName     string           `json:"returnOfficerName"`
	ReturnOfficerNIP      string           `json:"returnOfficerNip" gorm:"column:return_officer_nip"`
	ReturnOfficerPosition string           `json:"returnOfficerPosition"`
}

type TravelOrderSnapshot struct {
	Activity         *ActivityExecution `json:"activity"`
	Office           TravelOffice       `json:"office"`
	Employee         TravelPerson       `json:"employee"`
	Signer           TravelPerson       `json:"signer"`
	AssignmentNumber string             `json:"assignmentNumber"`
	Origin           string             `json:"origin"`
	Destination      string             `json:"destination"`
	DepartureDate    TravelDate         `json:"departureDate"`
	ReturnDate       TravelDate         `json:"returnDate"`
	Transport        string             `json:"transport"`
	TripType         string             `json:"tripType"`
	Purpose          string             `json:"purpose"`
	Program          string             `json:"program"`
	Kegiatan         string             `json:"kegiatan"`
	Subkegiatan      string             `json:"subkegiatan"`
}

type TravelOrder struct {
	ID                 int64 `json:"id" gorm:"primaryKey"`
	TravelOrderPayload `gorm:"embedded"`
	TravelAudit        `gorm:"embedded"`
	Snapshot           *TravelOrderSnapshot `json:"snapshot" gorm:"serializer:json;type:jsonb"`
	Details            TravelOrderSnapshot  `json:"details" gorm:"-"`
	DurationDays       int                  `json:"durationDays" gorm:"-"`
}

func (TravelOrder) TableName() string { return "spd" }

type TravelListParams struct {
	ActivityExecutionID int64
	Year                int
	Status              string
	Search              string
	EmployeeID          int64
	Destination         string
}
type TravelOptions struct {
	Employees   []TravelPerson `json:"employees"`
	Subkegiatan []Subkegiatan  `json:"subkegiatan"`
	Office      TravelOffice   `json:"office"`
}

func TravelDuration(start, end TravelDate) int {
	a, e1 := time.Parse("2006-01-02", string(start))
	b, e2 := time.Parse("2006-01-02", string(end))
	if e1 != nil || e2 != nil {
		return 0
	}
	return int(b.Sub(a).Hours() / 24)
}
