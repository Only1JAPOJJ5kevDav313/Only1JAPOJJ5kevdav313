import { apiFetch } from '../../apiFetch.js';
import { apiError } from '../error.js';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

export interface AdminSurveySummary {
  id: string;
  title: string;
  active: boolean;
  questionCount: number;
  totalResponses: number;
}

export interface AdminSurveyResults {
  survey: { id: string; title: string; description: string; active: boolean };
  totalResponses: number;
  questions: { id: string; text: string; yes: number; no: number }[];
  combinations: { answers: Record<string, boolean>; count: number }[];
}

export interface AdminSurveyResponse {
  userId: string;
  username: string;
  avatar: string | null;
  answers: Record<string, boolean>;
  createdAt: string;
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(`${API_BASE_URL}/api/admin/surveys${path}`, {
    credentials: 'include',
    ...init,
  });
  if (!res.ok) await apiError(res, `HTTP ${res.status}`);
  return res.json();
}

export async function fetchAdminSurveys(): Promise<AdminSurveySummary[]> {
  const data = await adminRequest<{ surveys: AdminSurveySummary[] }>('');
  return data.surveys;
}

export function fetchAdminSurveyResults(
  surveyId: string
): Promise<AdminSurveyResults> {
  return adminRequest(`/${encodeURIComponent(surveyId)}`);
}

export function fetchAdminSurveyResponses(
  surveyId: string,
  params: { page: number; limit: number; search?: string }
): Promise<{
  responses: AdminSurveyResponse[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) sp.set('search', params.search);
  return adminRequest(
    `/${encodeURIComponent(surveyId)}/responses?${sp.toString()}`
  );
}

export async function resetAdminSurveyResponse(
  surveyId: string,
  userId: string
): Promise<void> {
  await adminRequest(
    `/${encodeURIComponent(surveyId)}/responses/${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
}
