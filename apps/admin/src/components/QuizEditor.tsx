import { FormEvent, useEffect, useState } from 'react';
import { quizExists, saveQuiz } from '../services/quizzes';
import { createEmptyQuizForm, Quiz, QuizFormState, quizToFormState } from '../types/quiz';
import {
  hasValidationErrors,
  toQuizPayload,
  validateQuizForm,
  type QuizValidationErrors,
} from '../validation/quizValidation';

type QuizEditorProps = {
  onSaved: (quiz: Quiz, message: string) => void;
  quizzes: Quiz[];
  selectedQuiz: Quiz | null;
};

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function QuizEditor({ onSaved, quizzes, selectedQuiz }: QuizEditorProps) {
  const [form, setForm] = useState<QuizFormState>(() => createEmptyQuizForm(getTodayValue()));
  const [errors, setErrors] = useState<QuizValidationErrors>({});
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedQuiz) {
      setForm(quizToFormState(selectedQuiz));
      setMode('edit');
      setErrors({});
      setNotice('');
    }
  }, [selectedQuiz]);

  function startNewQuiz() {
    setForm(createEmptyQuizForm(getTodayValue()));
    setMode('new');
    setErrors({});
    setNotice('');
  }

  function updateChoiceText(choiceId: string, text: string) {
    setForm((current) => ({
      ...current,
      choices: current.choices.map((choice) => (choice.id === choiceId ? { ...choice, text } : choice)),
    }));
  }

  function toggleCorrectChoice(choiceId: string) {
    setForm((current) => ({
      ...current,
      correctChoiceIds: current.correctChoiceIds.includes(choiceId)
        ? current.correctChoiceIds.filter((id) => id !== choiceId)
        : [...current.correctChoiceIds, choiceId],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');

    const nextErrors = validateQuizForm(form);
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    setIsSaving(true);

    try {
      const payload = toQuizPayload(form);
      const existingQuiz = quizzes.find((quiz) => quiz.quizDate === payload.quizDate);

      if (mode === 'new' && (existingQuiz || (await quizExists(payload.quizDate)))) {
        setMode('edit');
        setNotice('같은 날짜의 퀴즈가 있어 기존 문서 수정 흐름으로 전환했습니다.');
        if (existingQuiz) {
          setForm(quizToFormState(existingQuiz));
        }
        return;
      }

      await saveQuiz(payload);
      onSaved(payload, mode === 'new' ? '미발행 퀴즈를 저장했습니다.' : '퀴즈를 수정했습니다.');
      setMode('edit');
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : '퀴즈 저장에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="detail-panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <h3>퀴즈 상세</h3>
          <p>{mode === 'new' ? '새 퀴즈를 미발행 상태로 저장합니다.' : '선택한 퀴즈를 수정합니다.'}</p>
        </div>
        <button className="secondary-button" onClick={startNewQuiz} type="button">
          새로 작성
        </button>
      </div>

      {notice ? <p className="notice-message" role="status">{notice}</p> : null}
      {errors.form ? <p className="error-message" role="alert">{errors.form}</p> : null}

      <section className="form-section">
        <h4>기본 정보</h4>
        <label>
          퀴즈 날짜
          <input
            onChange={(event) => setForm((current) => ({ ...current, quizDate: event.target.value }))}
            type="date"
            value={form.quizDate}
          />
        </label>
        {errors.quizDate ? <p className="field-error">{errors.quizDate}</p> : null}

        <label>
          포인트 금액
          <input
            min="1"
            onChange={(event) => setForm((current) => ({ ...current, promotionAmount: event.target.value }))}
            type="number"
            value={form.promotionAmount}
          />
        </label>
        {errors.promotionAmount ? <p className="field-error">{errors.promotionAmount}</p> : null}

        <div className="inline-status">
          <span className="badge warning">미발행 저장</span>
          <span className="badge neutral">진행 기록 확인 전</span>
        </div>
      </section>

      <section className="form-section">
        <h4>선택지</h4>
        {form.choices.map((choice, index) => (
          <label className="choice-row" key={choice.id}>
            <input
              aria-label={`${index + 1}번 정답`}
              checked={form.correctChoiceIds.includes(choice.id)}
              onChange={() => toggleCorrectChoice(choice.id)}
              type="checkbox"
            />
            <span>{index + 1}</span>
            <input
              onChange={(event) => updateChoiceText(choice.id, event.target.value)}
              placeholder={`${index + 1}번 선택지`}
              type="text"
              value={choice.text}
            />
          </label>
        ))}
        {errors.choices ? <p className="field-error">{errors.choices}</p> : null}
        {errors.correctChoiceIds ? <p className="field-error">{errors.correctChoiceIds}</p> : null}
      </section>

      <section className="form-section">
        <h4>스크립트</h4>
        <textarea
          onChange={(event) => setForm((current) => ({ ...current, script: event.target.value }))}
          placeholder="듣기 스크립트를 입력하세요."
          rows={6}
          value={form.script}
        />
        {errors.script ? <p className="field-error">{errors.script}</p> : null}
      </section>

      <section className="form-section">
        <h4>오디오</h4>
        <label>
          Storage 경로
          <input
            onChange={(event) => setForm((current) => ({ ...current, audioStoragePath: event.target.value }))}
            placeholder="quiz-audio/YYYY-MM-DD/file.mp3"
            type="text"
            value={form.audioStoragePath}
          />
        </label>
        {errors.audioStoragePath ? <p className="field-error">{errors.audioStoragePath}</p> : null}
        <p className="panel-message">mp3 업로드와 TTS 미리듣기는 다음 작업에서 연결합니다.</p>
      </section>

      <section className="form-section preview-box">
        <h4>미리보기</h4>
        <p className="preview-script">{form.script || '스크립트를 입력하면 미리보기에 표시됩니다.'}</p>
        <ol className="preview-choices">
          {form.choices.map((choice) => (
            <li key={choice.id}>{choice.text || '선택지 입력 전'}</li>
          ))}
        </ol>
      </section>

      <div className="action-bar">
        <button className="secondary-button" disabled type="button">
          발행 해제
        </button>
        <button className="secondary-button" disabled type="button">
          삭제
        </button>
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? '저장 중' : '미발행 저장'}
        </button>
      </div>
    </form>
  );
}
