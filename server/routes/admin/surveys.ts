import express from 'express';
import { requirePermission } from '../../middleware/rolePermissions.js';
import { logAdminAction } from '../../db/audit.js';
import { getClientIp } from '../../utils/getIpAddress.js';
import { getUserById } from '../../db/users.js';
import { SURVEYS, getSurvey } from '../../surveys/definitions.js';
import {
  deleteSurveyResponse,
  getSurveyAnswerCombinations,
  listSurveyResponses,
} from '../../db/surveys.js';

const router = express.Router();

router.get('/', requirePermission('admin'), async (_req, res) => {
  try {
    const surveys = await Promise.all(
      SURVEYS.map(async (s) => {
        const combos = await getSurveyAnswerCombinations(s.id);
        return {
          id: s.id,
          title: s.title,
          active: s.active,
          questionCount: s.questions.length,
          totalResponses: combos.reduce((n, c) => n + c.count, 0),
        };
      })
    );
    res.json({ surveys });
  } catch (error) {
    console.error('Error listing surveys:', error);
    res.status(500).json({ error: 'Failed to list surveys' });
  }
});

router.get('/:surveyId', requirePermission('admin'), async (req, res) => {
  try {
    const survey = getSurvey(req.params.surveyId);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    const combinations = await getSurveyAnswerCombinations(survey.id);
    const totalResponses = combinations.reduce((n, c) => n + c.count, 0);
    const questions = survey.questions.map((q) => {
      const yes = combinations
        .filter((c) => c.answers[q.id] === true)
        .reduce((n, c) => n + c.count, 0);
      const no = combinations
        .filter((c) => c.answers[q.id] === false)
        .reduce((n, c) => n + c.count, 0);
      return { id: q.id, text: q.text, yes, no };
    });

    res.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        active: survey.active,
      },
      totalResponses,
      questions,
      combinations,
    });
  } catch (error) {
    console.error('Error fetching survey results:', error);
    res.status(500).json({ error: 'Failed to fetch survey results' });
  }
});

router.get(
  '/:surveyId/responses',
  requirePermission('admin'),
  async (req, res) => {
    try {
      const survey = getSurvey(req.params.surveyId);
      if (!survey) return res.status(404).json({ error: 'Survey not found' });
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(
        1,
        Math.min(100, parseInt(req.query.limit as string, 10) || 25)
      );
      const search =
        typeof req.query.search === 'string' ? req.query.search.trim() : '';
      res.json(await listSurveyResponses(survey.id, page, limit, search));
    } catch (error) {
      console.error('Error listing survey responses:', error);
      res.status(500).json({ error: 'Failed to list survey responses' });
    }
  }
);

router.delete(
  '/:surveyId/responses/:userId',
  requirePermission('admin'),
  async (req, res) => {
    try {
      const survey = getSurvey(req.params.surveyId);
      if (!survey) return res.status(404).json({ error: 'Survey not found' });
      const { userId } = req.params;
      const deleted = await deleteSurveyResponse(survey.id, userId);
      if (!deleted)
        return res.status(404).json({ error: 'Response not found' });

      if (req.user?.userId) {
        const target = await getUserById(userId);
        const ip = getClientIp(req);
        await logAdminAction({
          adminId: req.user.userId,
          adminUsername: req.user.username || 'Unknown',
          actionType: 'SURVEY_RESPONSE_RESET',
          targetUserId: userId,
          targetUsername: target?.username ?? null,
          ipAddress: Array.isArray(ip) ? ip.join(', ') : ip,
          userAgent: req.get('User-Agent'),
          details: { surveyId: survey.id },
        });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('Error resetting survey response:', error);
      res.status(500).json({ error: 'Failed to reset survey response' });
    }
  }
);

export default router;
