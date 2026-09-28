import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appRequest } from '../helpers/appRequest.js';

vi.mock('../../../server/middleware/auth.js', () => ({
  __esModule: true,
  default: (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    req.user = {
      userId: 'u1',
      username: 'User',
      discriminator: '0',
      avatar: null,
      isAdmin: false,
    };
    next();
  },
}));

vi.mock('../../../server/db/surveys.js', () => ({
  hasSurveyResponse: vi.fn(),
  insertSurveyResponse: vi.fn(),
}));

import {
  hasSurveyResponse,
  insertSurveyResponse,
} from '../../../server/db/surveys.js';
import { getActiveSurvey } from '../../../server/surveys/definitions.js';
import surveysRouter from '../../../server/routes/surveys.js';

const survey = getActiveSurvey()!;
type ActiveBody = { survey: { id: string; questions: unknown[] } | null };
const allYes = Object.fromEntries(survey.questions.map((q) => [q.id, true]));

describe('surveys routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/', surveysRouter);

  beforeEach(() => {
    vi.mocked(hasSurveyResponse).mockReset();
    vi.mocked(insertSurveyResponse).mockReset();
  });

  it('returns the active survey to a user who has not answered', async () => {
    vi.mocked(hasSurveyResponse).mockResolvedValue(false);
    const res = await appRequest(app, 'GET', '/active');
    const body = res.body as ActiveBody;
    expect(res.status).toBe(200);
    expect(body.survey?.id).toBe(survey.id);
    expect(body.survey?.questions).toHaveLength(survey.questions.length);
  });

  it('returns null once the user has answered', async () => {
    vi.mocked(hasSurveyResponse).mockResolvedValue(true);
    const res = await appRequest(app, 'GET', '/active');
    expect(res.status).toBe(200);
    expect((res.body as ActiveBody).survey).toBeNull();
  });

  it('rejects incomplete answers', async () => {
    const [first] = survey.questions;
    const res = await appRequest(app, 'POST', `/${survey.id}/responses`, {
      answers: { [first.id]: true },
    });
    expect(res.status).toBe(400);
    expect(insertSurveyResponse).not.toHaveBeenCalled();
  });

  it('rejects non-boolean answers', async () => {
    const res = await appRequest(app, 'POST', `/${survey.id}/responses`, {
      answers: { ...allYes, [survey.questions[0].id]: 'yes' },
    });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown survey id', async () => {
    const res = await appRequest(app, 'POST', '/nope/responses', {
      answers: allYes,
    });
    expect(res.status).toBe(404);
  });

  it('stores only the known question ids', async () => {
    vi.mocked(insertSurveyResponse).mockResolvedValue(true);
    const res = await appRequest(app, 'POST', `/${survey.id}/responses`, {
      answers: { ...allYes, extra: false },
    });
    expect(res.status).toBe(201);
    expect(insertSurveyResponse).toHaveBeenCalledWith(survey.id, 'u1', allYes);
  });

  it('is idempotent when the user already answered', async () => {
    vi.mocked(insertSurveyResponse).mockResolvedValue(false);
    const res = await appRequest(app, 'POST', `/${survey.id}/responses`, {
      answers: allYes,
    });
    expect(res.status).toBe(200);
  });
});
