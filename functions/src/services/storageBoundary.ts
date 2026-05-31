export type AudioUrlRequest = {
  quizDate: string;
  requestBaseUrl: string;
};

export async function createAudioUrl({ quizDate, requestBaseUrl }: AudioUrlRequest): Promise<string> {
  const baseUrl = requestBaseUrl.endsWith('/') ? requestBaseUrl.slice(0, -1) : requestBaseUrl;

  return `${baseUrl}/quiz-audio?quizDate=${encodeURIComponent(quizDate)}`;
}
