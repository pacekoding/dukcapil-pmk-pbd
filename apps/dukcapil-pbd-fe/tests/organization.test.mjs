import assert from "node:assert/strict";
import { test } from "node:test";
import {
  employeeOrganizationOptions,
  changeEmployeeBidang,
  changeEmployeeSeksi,
} from "../lib/organization.ts";

const data = {
  fields: [
    { id: 1, isActive: true },
    { id: 2, isActive: false },
    { id: 3, isActive: true },
  ],
  sections: [
    { id: 11, bidangId: 1, isActive: true },
    { id: 12, bidangId: 1, isActive: false },
    { id: 21, bidangId: 2, isActive: true },
    { id: 31, bidangId: 3, isActive: true },
  ],
  positions: [
    { id: 101, bidangId: 1, seksiId: 11, isActive: true },
    { id: 102, bidangId: 1, seksiId: null, isActive: true },
    { id: 103, bidangId: 1, seksiId: 12, isActive: false },
    { id: 104, bidangId: 1, seksiId: 12, isActive: true },
    { id: 201, bidangId: 2, seksiId: null, isActive: true },
    { id: 301, bidangId: 3, seksiId: 31, isActive: true },
  ],
};
const ids = (items) => items.map((item) => item.id);

test("tambah pegawai hanya menawarkan master aktif dengan induk aktif", () => {
  const options = employeeOrganizationOptions(data, {
    bidangId: 1,
    seksiId: 12,
    jabatanId: null,
  });
  assert.deepEqual(ids(options.fields), [1, 3]);
  assert.deepEqual(ids(options.sections), [11]);
  assert.deepEqual(ids(options.positions), [102]);
  const inactive = employeeOrganizationOptions(data, {
    bidangId: 2,
    seksiId: null,
    jabatanId: null,
  });
  assert.deepEqual(inactive.positions, []);
});

test("edit mempertahankan master nonaktif existing dan memfilter hierarki", () => {
  const existing = { bidangId: 1, seksiId: 12, jabatanId: 103 };
  const options = employeeOrganizationOptions(data, existing, existing);
  assert.deepEqual(ids(options.sections), [11, 12]);
  assert.deepEqual(ids(options.positions), [102, 103]);
  const changed = employeeOrganizationOptions(
    data,
    { bidangId: 3, seksiId: 31, jabatanId: null },
    existing,
  );
  assert.deepEqual(ids(changed.sections), [31]);
  assert.deepEqual(ids(changed.positions), [301]);
  assert.deepEqual(
    ids(
      employeeOrganizationOptions(
        data,
        { bidangId: 2, seksiId: null, jabatanId: 201 },
        { bidangId: 2, seksiId: null, jabatanId: 201 },
      ).fields,
    ),
    [1, 2, 3],
  );
});

test("jabatan mengikuti seksi dan menyertakan jabatan langsung di bawah bidang", () => {
  assert.deepEqual(
    ids(
      employeeOrganizationOptions(data, {
        bidangId: 1,
        seksiId: 11,
        jabatanId: null,
      }).positions,
    ),
    [101, 102],
  );
  assert.deepEqual(
    ids(
      employeeOrganizationOptions(data, {
        bidangId: 1,
        seksiId: null,
        jabatanId: null,
      }).positions,
    ),
    [102],
  );
  assert.deepEqual(
    employeeOrganizationOptions(data, {
      bidangId: null,
      seksiId: null,
      jabatanId: null,
    }).sections,
    [],
  );
});

test("perubahan bidang mereset seksi dan jabatan; perubahan seksi mempertahankan hanya jabatan valid", () => {
  assert.deepEqual(changeEmployeeBidang(3), {
    bidangId: 3,
    seksiId: null,
    jabatanId: null,
  });
  assert.equal(
    changeEmployeeSeksi(
      data,
      { bidangId: 1, seksiId: 11, jabatanId: 101 },
      null,
    ).jabatanId,
    null,
  );
  assert.equal(
    changeEmployeeSeksi(
      data,
      { bidangId: 1, seksiId: null, jabatanId: 102 },
      11,
    ).jabatanId,
    102,
  );
});
