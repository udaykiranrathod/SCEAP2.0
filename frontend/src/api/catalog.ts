// frontend/src/api/catalog.ts
import { api } from './client';
import type { CatalogUploadResponse, CatalogMapResponse, CatalogMatchResponse } from '../types/catalog';

export async function uploadCatalog(file: File): Promise<CatalogUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<CatalogUploadResponse>('/cable/catalog/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function mapCatalog(token: string, mapping: Record<string, string>): Promise<CatalogMapResponse> {
  const res = await api.post<CatalogMapResponse>('/cable/catalog/map', { token, mapping });
  return res.data;
}

export async function matchCatalog(token: string, rows: any[], topN = 3): Promise<CatalogMatchResponse> {
  const res = await api.post<CatalogMatchResponse>('/cable/catalog/match', { token, rows, top_n: topN });
  return res.data;
}
