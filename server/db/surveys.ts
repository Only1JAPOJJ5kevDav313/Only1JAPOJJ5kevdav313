import { sql } from 'kysely';
import { mainDb } from './connection.js';

export type SurveyAnswers = Record<string, boolean>;

function parseAnswers(raw: unknown): SurveyAnswers {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (e): e is [string, boolean] => typeof e[1] === 'boolean'
    )
  );
}

export async function hasSurveyResponse(
  surveyId: string,
  userId: string
): Promise<boolean> {
  const row = await mainDb
    .selectFrom('survey_responses')
    .select('id')
    .where('survey_id', '=', surveyId)
    .where('user_id', '=', userId)
    .executeTakeFirst();
  return Boolean(row);
}

export async function insertSurveyResponse(
  surveyId: string,
  userId: string,
  answers: SurveyAnswers
): Promise<boolean> {
  const result = await mainDb
    .insertInto('survey_responses')
    .values({
      survey_id: surveyId,
      user_id: userId,
      answers: sql`CAST(${JSON.stringify(answers)} AS jsonb)`,
    })
    .onConflict((oc) => oc.columns(['survey_id', 'user_id']).doNothing())
    .executeTakeFirst();
  return Number(result.numInsertedOrUpdatedRows ?? 0) > 0;
}

export async function getSurveyAnswerCombinations(
  surveyId: string
): Promise<{ answers: SurveyAnswers; count: number }[]> {
  const rows = await mainDb
    .selectFrom('survey_responses')
    .select(['answers', sql<string>`count(*)`.as('count')])
    .where('survey_id', '=', surveyId)
    .groupBy('answers')
    .execute();
  return rows
    .map((r) => ({ answers: parseAnswers(r.answers), count: Number(r.count) }))
    .sort((a, b) => b.count - a.count);
}

export async function listSurveyResponses(
  surveyId: string,
  page: number,
  limit: number,
  search: string
) {
  let base = mainDb
    .selectFrom('survey_responses')
    .innerJoin('users', 'users.id', 'survey_responses.user_id')
    .where('survey_responses.survey_id', '=', surveyId);
  if (search) {
    const term = `%${search}%`;
    base = base.where((eb) =>
      eb.or([
        eb('users.username', 'ilike', term),
        eb('survey_responses.user_id', 'ilike', term),
      ])
    );
  }

  const [rows, totalRow] = await Promise.all([
    base
      .select([
        'survey_responses.user_id',
        'survey_responses.answers',
        'survey_responses.created_at',
        'users.username',
        'users.avatar',
      ])
      .orderBy('survey_responses.created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .execute(),
    base.select(sql<string>`count(*)`.as('count')).executeTakeFirst(),
  ]);

  const total = Number(totalRow?.count ?? 0);
  return {
    responses: rows.map((r) => ({
      userId: r.user_id,
      username: r.username,
      avatar: r.avatar ?? null,
      answers: parseAnswers(r.answers),
      createdAt: r.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function deleteSurveyResponse(
  surveyId: string,
  userId: string
): Promise<boolean> {
  const result = await mainDb
    .deleteFrom('survey_responses')
    .where('survey_id', '=', surveyId)
    .where('user_id', '=', userId)
    .executeTakeFirst();
  return Number(result.numDeletedRows ?? 0) > 0;
}
