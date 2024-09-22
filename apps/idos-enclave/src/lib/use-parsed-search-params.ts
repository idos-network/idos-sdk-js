import queryString from "query-string";
import { useSearch } from "wouter-preact";
import type { ParsedSearchParams } from "../types";

export function useParsedSearchParams(): ParsedSearchParams {
  return queryString.parse(useSearch()) as unknown as ParsedSearchParams;
}
