export function LoadingView() {
  return (
    <section className="state-view" aria-live="polite" aria-busy="true">
      <div className="state-view__indicator" />
      <h1>앱을 준비하고 있어요</h1>
      <p>잠시만 기다려 주세요.</p>
    </section>
  );
}
