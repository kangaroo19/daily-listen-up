import { randomUUID } from 'node:crypto';
import type {
  PromotionStatus,
  SubmissionResultRequest,
  SubmissionResultResponse,
  SubmitQuizRequest,
  SubmitQuizResponse,
  TodayProgressResponse,
  TossPointRewardRequest,
  TossPointRewardResponse,
} from '../../../shared/api/contracts.js';
import type { AppRepository, ProgressRecord } from '../repositories/types.js';
import { getKstQuizDate } from './date.js';
import { AppError } from './errors.js';

export class QuizService {
  constructor(private readonly repository: AppRepository) {}

  async getToday(userKey: string): Promise<TodayProgressResponse> {
    const quizDate = getKstQuizDate();
    const quiz = await this.repository.findQuizByDate(quizDate);

    if (quiz == null) {
      return {
        quizDate,
        status: 'no_quiz',
        attemptCount: 0,
        hasEarnedRetry: false,
        isPromotionGranted: false,
        promotionStatus: 'none',
      };
    }

    const progress = await this.getOrCreateProgress(
      userKey,
      quizDate,
      quiz.quizId,
    );
    return toTodayProgressResponse(progress);
  }

  async submit(
    userKey: string,
    request: SubmitQuizRequest,
  ): Promise<SubmitQuizResponse> {
    validateSubmitQuizRequest(request);

    const today = getKstQuizDate();
    if (request.quizDate !== today) {
      throw new AppError(
        422,
        'validation_error',
        '오늘 문제만 제출할 수 있어요.',
      );
    }

    const quiz = await this.repository.findQuizById(request.quizId);
    if (quiz == null || quiz.quizDate !== request.quizDate) {
      throw new AppError(404, 'not_found', '오늘 문제를 찾을 수 없어요.');
    }

    if (!Number.isInteger(request.choiceIndex) || request.choiceIndex < 0) {
      throw new AppError(422, 'validation_error', '선택지가 올바르지 않아요.');
    }

    if (request.choiceIndex >= quiz.choices.length) {
      throw new AppError(422, 'validation_error', '선택지가 올바르지 않아요.');
    }

    const existingSubmission = await this.repository.findSubmissionByUserQuiz(
      userKey,
      request.quizDate,
      request.quizId,
    );

    if (existingSubmission != null) {
      return {
        submissionId: existingSubmission.submissionId,
        requiresInterstitialAd: true,
      };
    }

    const progress = await this.getOrCreateProgress(
      userKey,
      request.quizDate,
      request.quizId,
    );

    if (progress.status === 'completed') {
      throw new AppError(409, 'conflict', '이미 오늘 학습을 완료했어요.');
    }

    const attemptCount = progress.attemptCount + 1;
    const submission = {
      submissionId: randomUUID(),
      userKey,
      quizDate: request.quizDate,
      quizId: request.quizId,
      choiceIndex: request.choiceIndex,
      isCorrect: request.choiceIndex === quiz.correctChoiceIndex,
      interstitialAdCompleted: false,
      createdAt: Date.now(),
    };

    await this.repository.saveSubmission(submission);
    await this.repository.saveProgress({
      ...progress,
      status: 'submitted',
      attemptCount,
      quizId: request.quizId,
    });

    return {
      submissionId: submission.submissionId,
      requiresInterstitialAd: true,
    };
  }

  async getResult(
    userKey: string,
    submissionId: string,
    request: SubmissionResultRequest,
  ): Promise<SubmissionResultResponse> {
    if (submissionId.trim() === '') {
      throw new AppError(422, 'validation_error', '제출 식별자가 필요해요.');
    }

    const submission = await this.repository.findSubmission(submissionId);
    if (submission == null) {
      throw new AppError(404, 'not_found', '제출 기록을 찾을 수 없어요.');
    }

    if (submission.userKey !== userKey) {
      throw new AppError(403, 'forbidden', '제출 결과를 확인할 수 없어요.');
    }

    if (request.interstitialAdCompleted === true) {
      await this.repository.saveSubmission({
        ...submission,
        interstitialAdCompleted: true,
      });
      submission.interstitialAdCompleted = true;
    }

    if (!submission.interstitialAdCompleted) {
      throw new AppError(
        403,
        'forbidden',
        '광고 완료 후 결과를 확인할 수 있어요.',
      );
    }

    const progress = await this.getOrCreateProgress(
      userKey,
      submission.quizDate,
      submission.quizId,
    );
    const status = submission.isCorrect ? 'correct' : 'incorrect';

    await this.repository.saveProgress({
      ...progress,
      status,
      attemptCount: Math.max(progress.attemptCount, 1),
      hasEarnedRetry: !submission.isCorrect,
    });

    return {
      isCorrect: submission.isCorrect,
      status,
      attemptCount: Math.max(progress.attemptCount, 1),
    };
  }

  async requestTossPoint(
    userKey: string,
    request: TossPointRewardRequest,
  ): Promise<TossPointRewardResponse> {
    validateRewardRequest(request);

    const progress = await this.repository.findProgress(
      userKey,
      request.quizDate,
    );
    if (progress == null || progress.quizId !== request.quizId) {
      throw new AppError(404, 'not_found', '오늘 학습 기록을 찾을 수 없어요.');
    }

    if (progress.status !== 'correct' && progress.status !== 'completed') {
      throw new AppError(
        409,
        'conflict',
        '정답 확인 후 포인트를 요청할 수 있어요.',
      );
    }

    if (progress.isPromotionGranted) {
      return {
        promotionStatus: 'already_granted',
        isPromotionGranted: true,
      };
    }

    const nextStatus: PromotionStatus =
      process.env.LOCAL_TOSS_POINT_AUTO_GRANT === 'true'
        ? 'granted'
        : 'requested';

    await this.repository.saveProgress({
      ...progress,
      status: 'completed',
      isPromotionGranted: nextStatus === 'granted',
      promotionStatus: nextStatus,
    });

    return {
      promotionStatus: nextStatus,
      isPromotionGranted: nextStatus === 'granted',
    };
  }

  private async getOrCreateProgress(
    userKey: string,
    quizDate: string,
    quizId: string,
  ): Promise<ProgressRecord> {
    const progress = await this.repository.findProgress(userKey, quizDate);

    if (progress != null) {
      return progress;
    }

    const nextProgress: ProgressRecord = {
      userKey,
      quizDate,
      quizId,
      status: 'not_started',
      attemptCount: 0,
      hasEarnedRetry: false,
      isPromotionGranted: false,
      promotionStatus: 'none',
    };

    await this.repository.saveProgress(nextProgress);
    return nextProgress;
  }
}

function toTodayProgressResponse(
  progress: ProgressRecord,
): TodayProgressResponse {
  return {
    quizDate: progress.quizDate,
    status: progress.status,
    attemptCount: progress.attemptCount,
    hasEarnedRetry: progress.hasEarnedRetry,
    isPromotionGranted: progress.isPromotionGranted,
    promotionStatus: progress.promotionStatus,
  };
}

function validateSubmitQuizRequest(request: SubmitQuizRequest): void {
  if (typeof request.quizDate !== 'string' || request.quizDate.trim() === '') {
    throw new AppError(422, 'validation_error', '문제 날짜가 필요해요.');
  }

  if (typeof request.quizId !== 'string' || request.quizId.trim() === '') {
    throw new AppError(422, 'validation_error', '문제 식별자가 필요해요.');
  }
}

function validateRewardRequest(request: TossPointRewardRequest): void {
  if (typeof request.quizDate !== 'string' || request.quizDate.trim() === '') {
    throw new AppError(422, 'validation_error', '문제 날짜가 필요해요.');
  }

  if (typeof request.quizId !== 'string' || request.quizId.trim() === '') {
    throw new AppError(422, 'validation_error', '문제 식별자가 필요해요.');
  }
}
