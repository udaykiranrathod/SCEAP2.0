export interface CatalogEntry {
  csa_mm2: number;
  conductor: string;
  cores: number;
  armour: string;
  r_ohm_per_km: number;
  x_ohm_per_km: number;
  od_mm: number;
  weight_kg_per_km: number;
  vendor: string;
  part_no: string;
  rated_current_air?: number | null;
  rated_current_trench?: number | null;
  rated_current_duct?: number | null;
}

export interface CatalogUploadResponse {
  token: string;
  headers: string[];
  sample: Record<string, any>[];
}

export interface CatalogMapResponse {
  token?: string;
  count: number;
  preview?: CatalogEntry[];
}

export interface CatalogMatchSuggestion {
  score: number;
  entry: CatalogEntry;
}

export interface CatalogMatchPerRow {
  row_index: number;
  cable_number: string;
  suggestions: CatalogMatchSuggestion[];
}

export interface CatalogMatchResponse {
  matches: CatalogMatchPerRow[];
}
