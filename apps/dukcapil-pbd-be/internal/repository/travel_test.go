package repository

import (
	"dukcapil-pbd-be/internal/model"
	"testing"
)

func TestTravelAssignmentValidation(t *testing.T) {
	valid := model.TravelAssignmentPayload{DocumentDate: "2026-10-24", IssuePlace: "Sorong", Bases: []string{"Dasar"}, Instructions: []string{"Penugasan"}, EmployeeIDs: []int64{1}, Origin: "Sorong", Destination: "Kabupaten Sorong", DepartureDate: "2026-10-26", ReturnDate: "2026-10-28", TripType: "Dalam Daerah", SignerID: 2}
	for _, change := range []func(*model.TravelAssignmentPayload){func(p *model.TravelAssignmentPayload) { p.ReturnDate = "2026-10-20" }, func(p *model.TravelAssignmentPayload) { p.DocumentDate = "2026-02-30" }, func(p *model.TravelAssignmentPayload) { p.EmployeeIDs = []int64{1, 1} }, func(p *model.TravelAssignmentPayload) { p.EmployeeIDs = nil }, func(p *model.TravelAssignmentPayload) { p.SignerID = 0 }, func(p *model.TravelAssignmentPayload) { p.Instructions = []string{" "} }} {
		p := valid
		change(&p)
		if err := ValidateTravelAssignment(&p); err == nil {
			t.Fatalf("accepted invalid: %+v", p)
		}
	}
	if err := ValidateTravelAssignment(&valid); err != nil {
		t.Fatal(err)
	}
}
func TestTravelOrderValidation(t *testing.T) {
	valid := model.TravelOrderPayload{AssignmentLetterID: 1, EmployeeID: 2, SignerID: 3, DocumentDate: "2026-10-24", IssuePlace: "Sorong", SKPD: "Dinas", FiscalYear: 2026}
	for _, change := range []func(*model.TravelOrderPayload){func(p *model.TravelOrderPayload) { p.EmployeeID = 0 }, func(p *model.TravelOrderPayload) { p.FiscalYear = 0 }, func(p *model.TravelOrderPayload) {
		p.Followers = []model.TravelFollower{{Name: "Pengikut", BirthDate: "2026-02-30"}}
	}, func(p *model.TravelOrderPayload) {
		p.Approvals = []model.TravelApproval{{ArrivalDate: "2026-10-28", DepartureDate: "2026-10-27"}}
	}} {
		p := valid
		change(&p)
		if err := ValidateTravelOrder(&p); err == nil {
			t.Fatalf("accepted invalid: %+v", p)
		}
	}
	if err := ValidateTravelOrder(&valid); err != nil {
		t.Fatal(err)
	}
}
