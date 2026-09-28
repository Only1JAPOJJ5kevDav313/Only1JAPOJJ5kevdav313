import { apiFetch } from '../apiFetch.js';
import { apiError } from './error.js';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

export interface SiteSettings {
  feedbackBannerEnabled: boolean;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await apiFetch(`${API_BASE_URL}/api/site-settings`, {
    credentials: 'include',
  });
  if (!res.ok) await apiError(res, 'Failed to load site settings');
  return res.json();
}
