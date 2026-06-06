package model

type HealthResponse struct {
	Status   string `json:"status"`
	Service  string `json:"service"`
	Time     string `json:"time"`
	Database string `json:"database,omitempty"`
}

type DashboardStat struct {
	Title       string `json:"title"`
	Value       string `json:"value"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
	Trend       string `json:"trend"`
	Description string `json:"description"`
}

type DashboardActivity struct {
	Title       string `json:"title"`
	Location    string `json:"location"`
	Status      string `json:"status"`
	Time        string `json:"time"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
	Description string `json:"description"`
}

type DashboardOverview struct {
	TahunAnggaran string              `json:"tahunAnggaran"`
	Stats         []DashboardStat     `json:"stats"`
	Activities    []DashboardActivity `json:"activities"`
}

type WebsiteStat struct {
	Label       string `json:"label"`
	Value       string `json:"value"`
	Description string `json:"description"`
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
	Stats          []WebsiteStat      `json:"stats"`
	Highlights     []WebsiteHighlight `json:"highlights"`
	ProfileSummary struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	} `json:"profileSummary"`
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
