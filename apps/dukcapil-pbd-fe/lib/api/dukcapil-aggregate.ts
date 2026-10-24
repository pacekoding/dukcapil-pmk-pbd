import { apiEndpoints } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/http";
import type {
  CivilRegistrationAggregate,
  DukcapilAggregateRegion,
  DukcapilAggregateResponse,
  PopulationRegistrationAggregate,
} from "@/types/dukcapil-aggregate";

export function getPopulationRegistration() {
  return apiRequest<DukcapilAggregateResponse<PopulationRegistrationAggregate>>(
    apiEndpoints.populationRegistration,
  );
}

export function updatePopulationRegistration(
  id: string,
  payload: PopulationRegistrationAggregate,
) {
  return apiRequest<DukcapilAggregateRegion<PopulationRegistrationAggregate>>(
    apiEndpoints.populationRegistrationDetail(id),
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export function getCivilRegistration() {
  return apiRequest<DukcapilAggregateResponse<CivilRegistrationAggregate>>(
    apiEndpoints.civilRegistration,
  );
}

export function updateCivilRegistration(
  id: string,
  payload: CivilRegistrationAggregate,
) {
  return apiRequest<DukcapilAggregateRegion<CivilRegistrationAggregate>>(
    apiEndpoints.civilRegistrationDetail(id),
    { method: "PUT", body: JSON.stringify(payload) },
  );
}
