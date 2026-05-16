export function getQuizAudioStoragePath(quizDate: string, quizId: string) {
  if (quizDate.trim().length === 0) {
    throw new Error('quizDate is required')
  }

  if (quizId.trim().length === 0) {
    throw new Error('quizId is required')
  }

  return `quiz-audio/${quizDate}/${quizId}.mp3`
}
