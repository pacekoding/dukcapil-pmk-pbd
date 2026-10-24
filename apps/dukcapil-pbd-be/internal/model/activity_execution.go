package model

import "time"

type ActivityExecutionPayload struct {
	SubkegiatanID         int64      `json:"subkegiatanId"`
	Title                 string     `json:"title"`
	Description           string     `json:"description"`
	StartDate             TravelDate `json:"startDate" gorm:"type:date"`
	EndDate               TravelDate `json:"endDate" gorm:"type:date"`
	Location              string     `json:"location"`
	FiscalYear            int        `json:"fiscalYear"`
	FundingSource         string     `json:"fundingSource"`
	PPTKEmployeeID        int64      `json:"pptkEmployeeId" gorm:"column:pptk_employee_id"`
	ResponsibleEmployeeID int64      `json:"responsibleEmployeeId"`
	ActivityType          string     `json:"activityType"`
	KabKotaID             *int64     `json:"kabKotaId"`
	Status                string     `json:"status"`
	RecommendedDocuments  []string   `json:"recommendedDocuments" gorm:"serializer:json;type:jsonb"`
}
type ActivityExecution struct {
	ID                       int64 `json:"id" gorm:"primaryKey"`
	ActivityExecutionPayload `gorm:"embedded"`
	CreatedBy                int64               `json:"createdBy"`
	UpdatedBy                int64               `json:"updatedBy"`
	CreatedAt                time.Time           `json:"createdAt"`
	UpdatedAt                time.Time           `json:"updatedAt"`
	Program                  string              `json:"program" gorm:"-"`
	Kegiatan                 string              `json:"kegiatan" gorm:"-"`
	Subkegiatan              string              `json:"subkegiatan" gorm:"-"`
	KabKotaName              string              `json:"kabKotaName" gorm:"-"`
	PPTK                     TravelPerson        `json:"pptk" gorm:"-"`
	Responsible              TravelPerson        `json:"responsible" gorm:"-"`
	Office                   TravelOffice        `json:"office" gorm:"-"`
	Checklist                []ActivityChecklist `json:"checklist" gorm:"-"`
}

func (ActivityExecution) TableName() string { return "pelaksanaan_kegiatan" }

type ActivityChecklist struct {
	Kind        string `json:"kind"`
	FinalCount  int64  `json:"finalCount"`
	DraftCount  int64  `json:"draftCount"`
	Recommended bool   `json:"recommended"`
}

type ActivityParty struct {
	EmployeeID  *int64 `json:"employeeId"`
	Name        string `json:"name"`
	NIP         string `json:"nip"`
	Rank        string `json:"rank"`
	Position    string `json:"position"`
	Institution string `json:"institution"`
	Address     string `json:"address"`
	Role        string `json:"role"`
}
type ActivitySection struct {
	Key   string `json:"key"`
	Title string `json:"title"`
	Body  string `json:"body"`
}
type ActivityFollowUp struct {
	Description string        `json:"description"`
	Responsible ActivityParty `json:"responsible"`
	DueDate     string        `json:"dueDate"`
	Status      string        `json:"status"`
}
type ActivityGood struct {
	Name      string  `json:"name"`
	Quantity  float64 `json:"quantity"`
	Unit      string  `json:"unit"`
	Condition string  `json:"condition"`
}
type ActivityDocumentContent struct {
	Nature              string             `json:"nature"`
	AttachmentNotice    string             `json:"attachmentNotice"`
	Subject             string             `json:"subject"`
	Preamble            string             `json:"preamble"`
	Closing             string             `json:"closing"`
	EventDate           string             `json:"eventDate"`
	Time                string             `json:"time"`
	Location            string             `json:"location"`
	Agenda              string             `json:"agenda"`
	InvitationReference string             `json:"invitationReference"`
	ChairEmployeeID     *int64             `json:"chairEmployeeId"`
	NotetakerEmployeeID *int64             `json:"notetakerEmployeeId"`
	RecordType          string             `json:"recordType"`
	Recipients          []ActivityParty    `json:"recipients"`
	Signers             []ActivityParty    `json:"signers"`
	Copies              []string           `json:"copies"`
	Bases               []string           `json:"bases"`
	Sections            []ActivitySection  `json:"sections"`
	FollowUps           []ActivityFollowUp `json:"followUps"`
	Goods               []ActivityGood     `json:"goods"`
}
type ActivityParticipant struct {
	ID               int64   `json:"id" gorm:"primaryKey"`
	DocumentID       int64   `json:"documentId"`
	EmployeeID       *int64  `json:"employeeId"`
	Rank             string  `json:"rank" gorm:"-"`
	Name             string  `json:"name"`
	Identification   string  `json:"identification"`
	Position         string  `json:"position"`
	Institution      string  `json:"institution"`
	Phone            string  `json:"phone"`
	Address          string  `json:"address"`
	Village          string  `json:"village"`
	KabKota          string  `json:"kabKota"`
	AssistanceType   string  `json:"assistanceType"`
	Quantity         float64 `json:"quantity"`
	Unit             string  `json:"unit"`
	AttendanceStatus string  `json:"attendanceStatus"`
	SignatureFileID  *int64  `json:"signatureFileId"`
	Notes            string  `json:"notes"`
	SortOrder        int     `json:"sortOrder"`
}

func (ActivityParticipant) TableName() string { return "peserta_dokumen_kegiatan" }

type ActivityDocumentPayload struct {
	ActivityExecutionID int64                   `json:"activityExecutionId"`
	Kind                string                  `json:"kind"`
	DocumentNumber      string                  `json:"documentNumber"`
	DocumentDate        TravelDate              `json:"documentDate" gorm:"type:date"`
	Content             ActivityDocumentContent `json:"content" gorm:"serializer:json;type:jsonb"`
	Participants        []ActivityParticipant   `json:"participants" gorm:"-"`
}
type ActivityDocumentSnapshot struct {
	Execution        ActivityExecution       `json:"execution"`
	Office           TravelOffice            `json:"office"`
	Content          ActivityDocumentContent `json:"content"`
	Participants     []ActivityParticipant   `json:"participants"`
	Chair            *TravelPerson           `json:"chair"`
	Notetaker        *TravelPerson           `json:"notetaker"`
	RelatedDocuments []ActivityDocumentLink  `json:"relatedDocuments"`
	Photos           []ActivityAttachment    `json:"photos"`
}
type ActivityDocument struct {
	ID                      int64 `json:"id" gorm:"primaryKey"`
	ActivityDocumentPayload `gorm:"embedded"`
	TravelAudit             `gorm:"embedded"`
	Snapshot                *ActivityDocumentSnapshot `json:"snapshot" gorm:"serializer:json;type:jsonb"`
	Details                 ActivityDocumentSnapshot  `json:"details" gorm:"-"`
}

func (ActivityDocument) TableName() string { return "dokumen_kegiatan" }

type ActivityDocumentLink struct {
	ID     int64  `json:"id"`
	Kind   string `json:"kind"`
	Number string `json:"number"`
	Status string `json:"status"`
}
type ActivityAttachmentPayload struct {
	Kind                string `json:"kind"`
	Category            string `json:"category"`
	Caption             string `json:"caption"`
	TakenAt             string `json:"takenAt"`
	LocationDescription string `json:"locationDescription"`
}
type ActivityAttachment struct {
	ID                        int64 `json:"id" gorm:"primaryKey"`
	ActivityExecutionID       int64 `json:"activityExecutionId"`
	FileID                    int64 `json:"fileId"`
	ActivityAttachmentPayload `gorm:"embedded"`
	CreatedBy                 int64      `json:"createdBy"`
	UpdatedBy                 int64      `json:"updatedBy"`
	CreatedAt                 time.Time  `json:"createdAt"`
	UpdatedAt                 time.Time  `json:"updatedAt"`
	DeletedAt                 *time.Time `json:"-"`
	File                      StoredFile `json:"file" gorm:"-"`
}

func (ActivityAttachment) TableName() string { return "lampiran_kegiatan" }

type ActivityExecutionDetail struct {
	Execution   ActivityExecution    `json:"execution"`
	Documents   []ActivityDocument   `json:"documents"`
	Assignments []TravelAssignment   `json:"assignments"`
	Orders      []TravelOrder        `json:"orders"`
	Attachments []ActivityAttachment `json:"attachments"`
}
type ActivityListParams struct {
	Year                int
	Search              string
	Status              string
	SubkegiatanID       int64
	ActivityType        string
	KabKotaID           int64
	ActivityExecutionID int64
	Kind                string
}
