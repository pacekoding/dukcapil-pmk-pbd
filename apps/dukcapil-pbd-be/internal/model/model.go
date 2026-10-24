package model

type HealthResponse struct {
	Status   string `json:"status"`
	Service  string `json:"service"`
	Time     string `json:"time"`
	Database string `json:"database,omitempty"`
}

type WebsiteHighlight struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type WebsiteHomeResponse struct {
	Hero struct {
		Eyebrow     string `json:"eyebrow"`
		Title       string `json:"title"`
		Description string `json:"description"`
	} `json:"hero"`
	Highlights []WebsiteHighlight `json:"highlights"`
}

type StrukturOrganisasiItem struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type ContactItem struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type WebsiteProfileResponse struct {
	Title       string                   `json:"title"`
	Description string                   `json:"description"`
	Visi        string                   `json:"visi"`
	Misi        []string                 `json:"misi"`
	Tugas       []string                 `json:"tugas"`
	Struktur    []StrukturOrganisasiItem `json:"struktur"`
	Wilayah     []string                 `json:"wilayah"`
	Contacts    []ContactItem            `json:"contacts"`
}
