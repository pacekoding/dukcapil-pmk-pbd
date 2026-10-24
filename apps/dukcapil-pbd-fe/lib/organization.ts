import type {
  OrganizationData,
  OrganizationSelection,
} from "../types/organization";

export function employeeOrganizationOptions(
  data: OrganizationData,
  selected: OrganizationSelection,
  existing?: OrganizationSelection | null,
) {
  const activeField = (id: number | null) =>
    data.fields.some((item) => item.id === id && item.isActive);
  const activeSection = (id: number | null) =>
    id === null ||
    data.sections.some((item) => item.id === id && item.isActive);
  return {
    fields: data.fields.filter(
      (item) => item.isActive || item.id === existing?.bidangId,
    ),
    sections: data.sections.filter(
      (item) =>
        item.bidangId === selected.bidangId &&
        ((item.isActive && activeField(item.bidangId)) ||
          item.id === existing?.seksiId),
    ),
    positions: data.positions.filter(
      (item) =>
        item.bidangId === selected.bidangId &&
        (item.seksiId === null || item.seksiId === selected.seksiId) &&
        ((item.isActive &&
          activeField(item.bidangId) &&
          activeSection(item.seksiId)) ||
          item.id === existing?.jabatanId),
    ),
  };
}

export function changeEmployeeBidang(
  bidangId: number | null,
): OrganizationSelection {
  return { bidangId, seksiId: null, jabatanId: null };
}

export function changeEmployeeSeksi(
  data: OrganizationData,
  selected: OrganizationSelection,
  seksiId: number | null,
): OrganizationSelection {
  const next = { ...selected, seksiId };
  const position = data.positions.find(
    (item) => item.id === selected.jabatanId,
  );
  if (
    !position ||
    position.bidangId !== next.bidangId ||
    (position.seksiId !== null && position.seksiId !== seksiId)
  )
    next.jabatanId = null;
  return next;
}
