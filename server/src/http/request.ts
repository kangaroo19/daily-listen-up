import { AppError } from '../services/errors.js';

export async function readJsonBody<TBody>(request: Request): Promise<TBody> {
  const text = await request.text();

  if (text.trim() === '') {
    return {} as TBody;
  }

  try {
    return JSON.parse(text) as TBody;
  } catch {
    throw new AppError(
      422,
      'validation_error',
      '요청 본문을 JSON으로 읽을 수 없어요.',
    );
  }
}
