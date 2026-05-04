import type { ApiErrorCode } from '../../../shared/api/contracts.js';

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(500, 'internal_error', '서버 요청 처리에 실패했어요.');
}
