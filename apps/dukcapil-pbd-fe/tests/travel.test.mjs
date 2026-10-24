import assert from "node:assert/strict";
import { test } from "node:test";
import { canAccessInternalHref } from "../lib/internal-access.ts";
import { internalMenus } from "../lib/navigation.ts";
import { travelDuration, assignmentFormPayload } from "../lib/travel.ts";

test("menu perjalanan dinas tersedia untuk seluruh role internal, bukan anonim", () => {
  const menu = internalMenus.find((item) => item.title === "Pelaksanaan Kegiatan");
  assert.ok(menu);
  assert.equal(menu.roles, undefined);
  assert.equal(menu.children.length, 8);
  for (const child of menu.children) {
    for (const role of [
      "superadmin",
      "admin_dukcapil",
      "admin_pmk",
      "admin_sekretariat",
    ])
      assert.equal(canAccessInternalHref(child.href, role), true);
    assert.equal(canAccessInternalHref(child.href, ""), false);
  }
});
test("durasi perjalanan merupakan selisih tanggal, termasuk tahun kabisat", () => {
  assert.equal(travelDuration("2028-02-28", "2028-03-01"), 2);
  assert.equal(travelDuration("2026-10-24", "2026-10-24"), 0);
  assert.equal(travelDuration("2026-10-28", "2026-10-24"), -4);
});
test("duplikasi/form edit hanya membawa payload, tanpa snapshot atau lifecycle", () => {
  const source = {
    number: "001",
    documentDate: "2026-10-24",
    issuePlace: "Sorong",
    bases: ["Dasar"],
    instructions: ["Tugas"],
    employeeIds: [1, 2],
    origin: "A",
    destination: "B",
    departureDate: "2026-10-26",
    returnDate: "2026-10-28",
    tripType: "Dalam Daerah",
    transport: "Darat",
    signerId: 3,
    status: "Final",
    snapshot: { employees: [{ name: "Nama Lama" }] },
    id: 12,
  };
  const payload = assignmentFormPayload(source);
  assert.deepEqual(payload.employeeIds, [1, 2]);
  assert.equal(payload.destination, "B");
  assert.equal("status" in payload, false);
  assert.equal("snapshot" in payload, false);
  assert.equal("id" in payload, false);
});
