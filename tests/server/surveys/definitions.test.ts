import { describe, expect, it } from 'vitest';
import {
  SURVEY_LIMITS,
  validateSurveyInput,
} from '../../../server/surveys/definitions.js';

describe('validateSurveyInput', () => {
  const base = {
    title: ' Title ',
    description: ' Desc ',
    questions: [{ id: 'keep_me', text: ' First? ' }, { text: 'Second?' }],
  };

  it('trims text, keeps valid ids and generates missing ones', () => {
    const r = validateSurveyInput(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.title).toBe('Title');
    expect(r.value.description).toBe('Desc');
    expect(r.value.questions[0]).toEqual({ id: 'keep_me', text: 'First?' });
    expect(r.value.questions[1].id).toMatch(/^q_[0-9a-f]{8}$/);
  });

  it('replaces duplicate ids so answers cannot collide', () => {
    const r = validateSurveyInput({
      ...base,
      questions: [
        { id: 'same', text: 'A?' },
        { id: 'same', text: 'B?' },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.questions[0].id).toBe('same');
    expect(r.value.questions[1].id).not.toBe('same');
  });

  it.each([
    [{ ...base, title: '   ' }],
    [{ ...base, questions: [] }],
    [{ ...base, questions: [{ text: '' }] }],
    [
      {
        ...base,
        questions: Array.from(
          { length: SURVEY_LIMITS.maxQuestions + 1 },
          () => ({
            text: 'Q?',
          })
        ),
      },
    ],
    [{ ...base, description: 'x'.repeat(SURVEY_LIMITS.description + 1) }],
    [null],
  ])('rejects invalid input %#', (input) => {
    expect(validateSurveyInput(input).ok).toBe(false);
  });
});
