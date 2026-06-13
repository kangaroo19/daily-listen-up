import { useEffect, useState } from 'react';
import { hasUserProgressForQuiz } from '../services/quizzes';
import { Quiz } from '../types/quiz';

export function useQuizProgressMap(quizzes: Quiz[]) {
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadProgressMap() {
      const entries = await Promise.all(
        quizzes.map(async (quiz) => {
          try {
            return [quiz.quizDate, await hasUserProgressForQuiz(quiz.quizDate)] as const;
          } catch {
            return [quiz.quizDate, false] as const;
          }
        }),
      );

      if (isMounted) {
        setProgressMap(Object.fromEntries(entries));
      }
    }

    void loadProgressMap();

    return () => {
      isMounted = false;
    };
  }, [quizzes]);

  return progressMap;
}
