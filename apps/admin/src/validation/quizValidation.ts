import { Quiz, QuizFormState } from '../types/quiz';

export type QuizValidationErrors = Partial<Record<keyof QuizFormState | 'form', string>>;

const quizDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateQuizForm(form: QuizFormState): QuizValidationErrors {
  const errors: QuizValidationErrors = {};
  const choiceIds = new Set(form.choices.map((choice) => choice.id));
  const promotionAmount = Number(form.promotionAmount);

  if (!quizDatePattern.test(form.quizDate)) {
    errors.quizDate = '날짜는 YYYY-MM-DD 형식이어야 합니다.';
  }

  if (form.choices.length !== 5) {
    errors.choices = '선택지는 정확히 5개여야 합니다.';
  } else if (form.choices.some((choice) => !choice.text.trim())) {
    errors.choices = '선택지 5개를 모두 입력하세요.';
  }

  if (form.correctChoiceIds.length === 0) {
    errors.correctChoiceIds = '정답을 1개 이상 선택하세요.';
  } else if (form.correctChoiceIds.some((choiceId) => !choiceIds.has(choiceId))) {
    errors.correctChoiceIds = '정답은 존재하는 선택지 ID만 선택할 수 있습니다.';
  }

  if (!form.script.trim()) {
    errors.script = '스크립트를 입력하세요.';
  }

  if (!form.audioStoragePath.trim()) {
    errors.audioStoragePath = '04번 오디오 업로드 전까지는 기존 Storage 경로를 입력해야 저장할 수 있습니다.';
  }

  if (!Number.isInteger(promotionAmount) || promotionAmount <= 0) {
    errors.promotionAmount = '포인트 금액은 양수 정수여야 합니다.';
  }

  return errors;
}

export function hasValidationErrors(errors: QuizValidationErrors) {
  return Object.keys(errors).length > 0;
}

export function toQuizPayload(form: QuizFormState): Quiz {
  return {
    quizDate: form.quizDate,
    isPublished: false,
    audioStoragePath: form.audioStoragePath.trim(),
    choices: form.choices.map((choice) => ({
      id: choice.id,
      text: choice.text.trim(),
    })),
    correctChoiceIds: form.correctChoiceIds,
    script: form.script.trim(),
    promotionAmount: Number(form.promotionAmount),
  };
}
