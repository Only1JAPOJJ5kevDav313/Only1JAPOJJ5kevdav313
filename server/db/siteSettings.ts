import { mainDb } from './connection.js';
import { DEPLOYMENT } from '../utils/cacheTtl.js';

export interface SiteSettings {
  feedbackBannerEnabled: boolean;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await mainDb
    .selectFrom('app_settings')
    .select(['feedback_banner_enabled'])
    .where('channel', '=', DEPLOYMENT)
    .executeTakeFirst();
  return { feedbackBannerEnabled: row?.feedback_banner_enabled ?? false };
}

export async function updateSiteSettings(
  updates: Partial<SiteSettings>
): Promise<SiteSettings> {
  if (typeof updates.feedbackBannerEnabled === 'boolean') {
    await mainDb
      .updateTable('app_settings')
      .set({ feedback_banner_enabled: updates.feedbackBannerEnabled })
      .where('channel', '=', DEPLOYMENT)
      .execute();
  }
  return getSiteSettings();
}
