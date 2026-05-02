type InitFailedViewProps = {
  error: Error;
  onRetry: () => void;
};

export function InitFailedView({ error, onRetry }: InitFailedViewProps) {
  return (
    <section className="state-view" aria-live="assertive">
      <h1>앱을 시작하지 못했어요</h1>
      <p>{error.message}</p>
      <button className="primary-button" type="button" onClick={onRetry}>
        다시 시도
      </button>
    </section>
  );
}
