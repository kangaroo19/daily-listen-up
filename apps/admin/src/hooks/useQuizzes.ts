import { useEffect, useState } from 'react';
import { subscribeToQuizzes } from '../services/quizzes';
import { Quiz } from '../types/quiz';

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToQuizzes(
      (nextQuizzes) => {
        setQuizzes(nextQuizzes);
        setErrorMessage('');
        setIsLoading(false);
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { quizzes, errorMessage, isLoading };
}
