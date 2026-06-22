import { QuizFormState } from '../types/quiz';

type ImportChoice = {
  id?: unknown;
  text?: unknown;
};

type ImportPayload = {
  quizDate?: unknown;
  audioFileName?: unknown;
  speakerGender?: unknown;
  script?: unknown;
  choices?: unknown;
  correctChoiceIds?: unknown;
  promotionAmount?: unknown;
};

const quizDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export type JsonQuizImportResult =
  | {
      ok: true;
      form: QuizFormState;
      audioFileName: string;
    }
  | {
      ok: false;
      error: string;
    };

export function parseJsonQuizImport(jsonText: string, selectedAudioFileName: string): JsonQuizImportResult {
  let payload: unknown;

  try {
    payload = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: 'JSON 형식을 확인하세요.' };
  }

  if (!isPlainObject(payload)) {
    return { ok: false, error: 'quizPool.json 단일 객체 1개만 붙여넣을 수 있습니다.' };
  }

  const quiz = payload as ImportPayload;

  if (Array.isArray(payload)) {
    return { ok: false, error: '배열 JSON은 지원하지 않습니다. 단일 객체 1개만 붙여넣으세요.' };
  }

  if (typeof quiz.quizDate !== 'string' || !quizDatePattern.test(quiz.quizDate)) {
    return { ok: false, error: 'quizDate는 YYYY-MM-DD 형식이어야 합니다.' };
  }

  if (typeof quiz.audioFileName !== 'string' || !quiz.audioFileName.trim()) {
    return { ok: false, error: 'audioFileName을 입력하세요.' };
  }

  if (!selectedAudioFileName) {
    return { ok: false, error: 'JSON에 연결할 mp3 파일을 선택하세요.' };
  }

  if (quiz.audioFileName !== selectedAudioFileName) {
    return { ok: false, error: 'audioFileName과 선택한 mp3 파일명이 일치해야 합니다.' };
  }

  if (typeof quiz.script !== 'string' || !quiz.script.trim()) {
    return { ok: false, error: 'script를 입력하세요.' };
  }

  if (!Array.isArray(quiz.choices) || quiz.choices.length !== 5) {
    return { ok: false, error: 'choices는 정확히 5개여야 합니다.' };
  }

  const choices = quiz.choices.map((choice) => normalizeChoice(choice));

  if (choices.some((choice) => choice == null)) {
    return { ok: false, error: 'choices의 각 항목에는 id와 text가 필요합니다.' };
  }

  const normalizedChoices = choices as QuizFormState['choices'];
  const choiceIds = new Set(normalizedChoices.map((choice) => choice.id));

  if (choiceIds.size !== normalizedChoices.length) {
    return { ok: false, error: 'choices의 id는 중복될 수 없습니다.' };
  }

  if (!Array.isArray(quiz.correctChoiceIds) || quiz.correctChoiceIds.length !== 1) {
    return { ok: false, error: 'correctChoiceIds는 정답 id 1개만 포함해야 합니다.' };
  }

  if (quiz.correctChoiceIds.some((choiceId) => typeof choiceId !== 'string' || !choiceIds.has(choiceId))) {
    return { ok: false, error: 'correctChoiceIds는 choices에 존재하는 id만 포함해야 합니다.' };
  }

  const promotionAmount = quiz.promotionAmount;

  if (typeof promotionAmount !== 'number' || !Number.isInteger(promotionAmount) || promotionAmount <= 0) {
    return { ok: false, error: 'promotionAmount는 양수 정수여야 합니다.' };
  }

  return {
    ok: true,
    audioFileName: quiz.audioFileName,
    form: {
      quizDate: quiz.quizDate,
      audioStoragePath: '',
      choices: normalizedChoices,
      correctChoiceIds: quiz.correctChoiceIds as string[],
      script: quiz.script,
      promotionAmount: String(promotionAmount),
    },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeChoice(choice: unknown) {
  if (!isPlainObject(choice)) {
    return null;
  }

  const payload = choice as ImportChoice;

  if (typeof payload.id !== 'string' || !payload.id.trim() || typeof payload.text !== 'string' || !payload.text.trim()) {
    return null;
  }

  return {
    id: payload.id,
    text: payload.text,
  };
}
