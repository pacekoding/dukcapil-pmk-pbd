import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activityRecommendations,
  activityProgress,
  activityDocumentHref,
  activityTypes,
} from "../lib/activity-execution.ts";
import { validateClientUpload } from "../lib/api/file-policy.ts";
test("rekomendasi tidak memaksa seluruh dokumen dan bantuan memakai tanda terima", () => {
  assert.deepEqual(activityRecommendations("Lainnya"), []);
  assert.ok(!activityRecommendations("Rapat / Rakor").includes("spd"));
  assert.ok(activityRecommendations("Penyerahan Bantuan").includes("receipts"));
  for (const type of activityTypes)
    assert.equal(
      new Set(activityRecommendations(type)).size,
      activityRecommendations(type).length,
    );
});
test("progress hanya menghitung rekomendasi dengan dokumen Final", () => {
  assert.deepEqual(
    activityProgress([
      { recommended: true, finalCount: 1 },
      { recommended: true, finalCount: 0 },
      { recommended: false, finalCount: 3 },
    ]),
    { complete: 1, total: 2 },
  );
  assert.deepEqual(activityProgress([]), { complete: 0, total: 0 });
  assert.match(
    activityDocumentHref("receipts", 2),
    /daftar-penerima\?activityId=2$/,
  );
});
test("format Office hanya diperluas untuk lampiran kegiatan", () => {
  for (const ext of ["docx", "xlsx"]) {
    const f = new File(["dummy"], `materi.${ext}`);
    assert.doesNotThrow(() => validateClientUpload(f, "activity-attachment"));
    assert.throws(() => validateClientUpload(f, "archive"));
  }
  assert.throws(() =>
    validateClientUpload(new File([], "kosong.pdf"), "activity-attachment"),
  );
  assert.throws(() =>
    validateClientUpload(
      new File(["script"], "script.exe"),
      "activity-attachment",
    ),
  );
});
