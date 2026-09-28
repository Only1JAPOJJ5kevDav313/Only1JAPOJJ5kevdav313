import { useCallback, useEffect, useState } from 'react';
import { fetchActiveSurvey, type Survey } from '../utils/fetch/surveys';

export function useActiveSurvey(user: { userId?: string } | null) {
  const [survey, setSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    if (!user) {
      setSurvey(null);
      return;
    }
    let cancelled = false;
    fetchActiveSurvey()
      .then((s) => {
        if (!cancelled) setSurvey(s);
      })
      .catch((error) => {
        console.error('Error fetching active survey:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const markSubmitted = useCallback(() => setSurvey(null), []);

  return { survey, markSubmitted };
}
