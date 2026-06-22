import { FormEvent, useEffect, useState } from 'react';
import { deleteQuizAudio, isMp3File, uploadQuizAudio } from '../services/audioStorage';
import { deleteQuizDocument, quizExists, saveQuiz, updateQuizPublication } from '../services/quizzes';
import { createEmptyQuizForm, Quiz, QuizFormState, quizToFormState } from '../types/quiz';
import { parseJsonQuizImport } from '../validation/jsonQuizImport';
import {
  hasValidationErrors,
  toQuizPayload,
  validateQuizForm,
  type QuizValidationErrors,
} from '../validation/quizValidation';

type QuizEditorProps = {
  hasProgress?: boolean;
  onDeleted: (message: string) => void;
  onSaved: (quiz: Quiz, message: string) => void;
  quizzes: Quiz[];
  selectedQuiz: Quiz | null;
};

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function QuizEditor({ hasProgress = false, onDeleted, onSaved, quizzes, selectedQuiz }: QuizEditorProps) {
  const [form, setForm] = useState<QuizFormState>(() => createEmptyQuizForm(getTodayValue()));
  const [errors, setErrors] = useState<QuizValidationErrors>({});
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [notice, setNotice] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [inputMode, setInputMode] = useState<'manual' | 'json'>('manual');
  const [jsonText, setJsonText] = useState('');
  const [jsonAudioFile, setJsonAudioFile] = useState<File | null>(null);
  const [jsonImportError, setJsonImportError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedQuiz) {
      setForm(quizToFormState(selectedQuiz));
      setMode('edit');
      setErrors({});
      setNotice('');
      setWarningMessage('');
      setAudioFile(null);
      setAudioPreviewUrl('');
      setJsonImportError('');
      setJsonAudioFile(null);
    }
  }, [selectedQuiz]);

  function startNewQuiz() {
    setForm(createEmptyQuizForm(getTodayValue()));
    setMode('new');
    setErrors({});
    setNotice('');
    setWarningMessage('');
    setAudioFile(null);
    setAudioPreviewUrl('');
    setInputMode('manual');
    setJsonText('');
    setJsonAudioFile(null);
    setJsonImportError('');
  }

  function handleAudioFileChange(file: File | undefined) {
    setWarningMessage('');

    if (hasProgress) {
      setWarningMessage('진행 기록이 있는 퀴즈는 오디오를 교체할 수 없습니다.');
      return;
    }

    if (!file) {
      clearAudioFile();
      return;
    }

    applyAudioFile(file);
  }

  function clearAudioFile() {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setAudioFile(null);
    setAudioPreviewUrl('');
  }

  function applyAudioFile(file: File) {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    if (!isMp3File(file)) {
      setAudioFile(null);
      setAudioPreviewUrl('');
      setErrors((current) => ({ ...current, audioStoragePath: 'mp3 파일만 업로드할 수 있습니다.' }));
      return;
    }

    setErrors((current) => ({ ...current, audioStoragePath: undefined }));
    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  }

  function handleJsonAudioFileChange(file: File | undefined) {
    setJsonImportError('');

    if (hasProgress) {
      setJsonImportError('진행 기록이 있는 퀴즈는 JSON 가져오기와 오디오 교체를 할 수 없습니다.');
      return;
    }

    if (!file) {
      setJsonAudioFile(null);
      return;
    }

    if (!isMp3File(file)) {
      setJsonAudioFile(null);
      setJsonImportError('mp3 파일만 선택할 수 있습니다.');
      return;
    }

    setJsonAudioFile(file);
  }

  function handleImportJson() {
    setNotice('');
    setJsonImportError('');

    if (hasProgress) {
      setJsonImportError('진행 기록이 있는 퀴즈는 JSON 가져오기와 오디오 교체를 할 수 없습니다.');
      return;
    }

    const result = parseJsonQuizImport(jsonText, jsonAudioFile?.name ?? '');

    if (!result.ok) {
      setJsonImportError(result.error);
      return;
    }

    setForm(result.form);
    setErrors({});
    applyAudioFile(jsonAudioFile as File);
    setMode('new');
    setNotice('JSON 내용을 기존 퀴즈 폼에 반영했습니다. 확인 후 미발행 저장하세요.');
  }

  function updateChoiceText(choiceId: string, text: string) {
    setForm((current) => ({
      ...current,
      choices: current.choices.map((choice) => (choice.id === choiceId ? { ...choice, text } : choice)),
    }));
  }

  function selectCorrectChoice(choiceId: string) {
    setForm((current) => ({
      ...current,
      correctChoiceIds: [choiceId],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');

    const nextErrors = validateQuizForm(form, { hasPendingAudioFile: Boolean(audioFile) });
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    setIsSaving(true);

    try {
      let payload = {
        ...toQuizPayload(form),
        isPublished: selectedQuiz?.isPublished ?? false,
      };
      const existingQuiz = quizzes.find((quiz) => quiz.quizDate === payload.quizDate);

      if (mode === 'new' && (existingQuiz || (await quizExists(payload.quizDate)))) {
        setMode('edit');
        setNotice('같은 날짜의 퀴즈가 있어 기존 문서 수정 흐름으로 전환했습니다.');
        if (existingQuiz) {
          setForm(quizToFormState(existingQuiz));
        }
        return;
      }

      const previousAudioStoragePath = selectedQuiz?.audioStoragePath;
      let uploadedAudioPath = '';

      if (hasProgress && selectedQuiz) {
        payload = {
          ...payload,
          choices: payload.choices.map((choice, index) => ({
            id: selectedQuiz.choices[index]?.id ?? choice.id,
            text: choice.text,
          })),
          correctChoiceIds: selectedQuiz.correctChoiceIds,
          promotionAmount: selectedQuiz.promotionAmount,
          audioStoragePath: selectedQuiz.audioStoragePath,
        };
      } else if (audioFile) {
        try {
          uploadedAudioPath = await uploadQuizAudio(payload.quizDate, audioFile);
          payload = {
            ...payload,
            audioStoragePath: uploadedAudioPath,
          };
        } catch (error) {
          setErrors({
            form: error instanceof Error ? error.message : '오디오 업로드에 실패했습니다.',
          });
          return;
        }
      }

      try {
        await saveQuiz(payload);
      } catch (error) {
        const cleanupMessage = uploadedAudioPath ? ` 새로 업로드된 ${uploadedAudioPath} 파일은 운영 정리가 필요합니다.` : '';
        setErrors({
          form: `${error instanceof Error ? error.message : '퀴즈 저장에 실패했습니다.'}${cleanupMessage}`,
        });
        return;
      }

      if (uploadedAudioPath && previousAudioStoragePath && previousAudioStoragePath !== uploadedAudioPath) {
        try {
          await deleteQuizAudio(previousAudioStoragePath);
        } catch {
          setWarningMessage(`기존 오디오 ${previousAudioStoragePath} 삭제에 실패했습니다. 운영 정리가 필요합니다.`);
        }
      }

      onSaved(payload, mode === 'new' ? '미발행 퀴즈를 저장했습니다.' : '퀴즈를 수정했습니다.');
      setMode('edit');
      setAudioFile(null);
      setAudioPreviewUrl('');
      setJsonAudioFile(null);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : '퀴즈 저장에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!selectedQuiz) {
      return;
    }

    try {
      await updateQuizPublication(selectedQuiz.quizDate, true);
      onSaved({ ...selectedQuiz, isPublished: true }, '퀴즈를 발행했습니다.');
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : '퀴즈 발행에 실패했습니다.' });
    }
  }

  async function handleUnpublish() {
    if (!selectedQuiz) {
      return;
    }

    const confirmed = window.confirm(
      hasProgress
        ? '발행 해제하면 기존 진행자의 재도전과 스크립트 열람도 막힙니다. 계속할까요?'
        : '이 퀴즈를 발행 해제할까요?',
    );

    if (!confirmed) {
      return;
    }

    try {
      await updateQuizPublication(selectedQuiz.quizDate, false);
      onSaved({ ...selectedQuiz, isPublished: false }, '퀴즈를 발행 해제했습니다.');
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : '퀴즈 발행 해제에 실패했습니다.' });
    }
  }

  async function handleDelete() {
    if (!selectedQuiz || hasProgress) {
      return;
    }

    const confirmed = window.confirm('진행 기록이 없는 퀴즈를 실제 삭제합니다. 계속할까요?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteQuizDocument(selectedQuiz.quizDate);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : '퀴즈 삭제에 실패했습니다.' });
      return;
    }

    let deleteMessage = '퀴즈를 삭제했습니다.';

    if (selectedQuiz.audioStoragePath) {
      try {
        await deleteQuizAudio(selectedQuiz.audioStoragePath);
      } catch {
        deleteMessage = `퀴즈 문서는 삭제했지만 ${selectedQuiz.audioStoragePath} 오디오 삭제에 실패했습니다.`;
      }
    }

    onDeleted(deleteMessage);
    startNewQuiz();
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
      {warningMessage ? <p className="warning-message" role="status">{warningMessage}</p> : null}
      {errors.form ? <p className="error-message" role="alert">{errors.form}</p> : null}

      <section className="form-section">
        <h4>입력 방식</h4>
        <div className="input-mode-toggle" role="group" aria-label="퀴즈 입력 방식">
          <button
            className={inputMode === 'manual' ? 'primary-button' : 'secondary-button'}
            onClick={() => setInputMode('manual')}
            type="button"
          >
            수동 입력
          </button>
          <button
            className={inputMode === 'json' ? 'primary-button' : 'secondary-button'}
            onClick={() => setInputMode('json')}
            type="button"
          >
            JSON 입력
          </button>
        </div>
        {inputMode === 'json' ? (
          <div className="json-import-panel">
            <label>
              quizPool.json 단일 객체
              <textarea
                disabled={hasProgress}
                onChange={(event) => setJsonText(event.target.value)}
                placeholder='{"quizDate":"2026-06-14","audioFileName":"example.mp3",...}'
                rows={10}
                value={jsonText}
              />
            </label>
            <label>
              JSON에 연결할 mp3 파일
              <input
                accept="audio/mpeg,.mp3"
                disabled={hasProgress}
                onChange={(event) => handleJsonAudioFileChange(event.target.files?.[0])}
                type="file"
              />
            </label>
            {jsonAudioFile ? <p className="panel-message">선택한 파일: {jsonAudioFile.name}</p> : null}
            {jsonImportError ? <p className="field-error">{jsonImportError}</p> : null}
            <button className="secondary-button" disabled={hasProgress} onClick={handleImportJson} type="button">
              JSON 가져오기
            </button>
          </div>
        ) : null}
      </section>

      <section className="form-section">
        <h4>기본 정보</h4>
        <label>
          퀴즈 날짜
          <input
            disabled={mode === 'edit'}
            onChange={(event) => setForm((current) => ({ ...current, quizDate: event.target.value }))}
            type="date"
            value={form.quizDate}
          />
        </label>
        {errors.quizDate ? <p className="field-error">{errors.quizDate}</p> : null}

        <label>
          포인트 금액
          <input
            disabled={hasProgress}
            min="1"
            onChange={(event) => setForm((current) => ({ ...current, promotionAmount: event.target.value }))}
            type="number"
            value={form.promotionAmount}
          />
        </label>
        {errors.promotionAmount ? <p className="field-error">{errors.promotionAmount}</p> : null}

        <div className="inline-status">
          <span className={`badge ${selectedQuiz?.isPublished ? 'success' : 'warning'}`}>
            {selectedQuiz?.isPublished ? '발행' : '미발행'}
          </span>
          <span className={`badge ${hasProgress ? 'warning' : 'neutral'}`}>
            {hasProgress ? '진행 기록 있음' : '진행 기록 없음'}
          </span>
        </div>
        {hasProgress ? (
          <p className="warning-message">
            진행 기록이 있어 정답, 포인트, 오디오, 선택지 ID와 개수는 잠깁니다. 선택지 문구와 스크립트 오탈자만 정정하세요.
          </p>
        ) : null}
      </section>

      <section className="form-section">
        <h4>선택지</h4>
        {form.choices.map((choice, index) => (
          <label className="choice-row" key={choice.id}>
            <input
              aria-label={`${index + 1}번 정답`}
              checked={form.correctChoiceIds.includes(choice.id)}
              disabled={hasProgress}
              name="correct-choice"
              onChange={() => selectCorrectChoice(choice.id)}
              type="radio"
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
          mp3 파일
          <input
            accept="audio/mpeg,.mp3"
            disabled={hasProgress}
            onChange={(event) => handleAudioFileChange(event.target.files?.[0])}
            type="file"
          />
        </label>
        {audioFile ? (
          <div className="audio-preview">
            <strong>{audioFile.name}</strong>
            <audio controls src={audioPreviewUrl}>
              <track kind="captions" />
            </audio>
          </div>
        ) : null}
        <label>
          Storage 경로
          <input
            onChange={(event) => setForm((current) => ({ ...current, audioStoragePath: event.target.value }))}
            placeholder="quiz-audio/YYYY-MM-DD/file.mp3"
            disabled={hasProgress}
            type="text"
            value={form.audioStoragePath}
          />
        </label>
        {errors.audioStoragePath ? <p className="field-error">{errors.audioStoragePath}</p> : null}
        <p className="panel-message">새 mp3를 선택하면 저장 시 quiz-audio/YYYY-MM-DD/... 경로로 업로드됩니다.</p>
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
        <button className="danger-button" disabled={!selectedQuiz || hasProgress} onClick={handleDelete} type="button">
          삭제
        </button>
        <button className="secondary-button" disabled={!selectedQuiz || !selectedQuiz.isPublished} onClick={handleUnpublish} type="button">
          발행 해제
        </button>
        <button className="secondary-button" disabled={!selectedQuiz || selectedQuiz.isPublished} onClick={handlePublish} type="button">
          발행
        </button>
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? '저장 중' : '미발행 저장'}
        </button>
      </div>
    </form>
  );
}
