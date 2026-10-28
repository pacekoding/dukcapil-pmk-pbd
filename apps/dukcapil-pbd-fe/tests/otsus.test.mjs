import test from "node:test";
import assert from "node:assert/strict";
import { otsusBudget } from "../lib/otsus.ts";

test("anggaran Otsus menghitung sisa dan persentase", () => {
  assert.deepEqual(otsusBudget(260_000_000, 130_000_000), { sisa: 130_000_000, persentase: 50 });
});

test("persentase Otsus bernilai nol saat pagu nol", () => {
  assert.deepEqual(otsusBudget(0, 0), { sisa: 0, persentase: 0 });
});
