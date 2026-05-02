export type TossRuntime = {
  isInTossApp: boolean;
  sdk: TossWebFramework | null;
};

type TossWebFramework = typeof import('@apps-in-toss/web-framework');

export async function detectTossRuntime(): Promise<TossRuntime> {
  try {
    const sdk = await import('@apps-in-toss/web-framework');

    return {
      isInTossApp: hasTossUserAgent(),
      sdk,
    };
  } catch {
    return {
      isInTossApp: false,
      sdk: null,
    };
  }
}

function hasTossUserAgent() {
  return /toss/i.test(window.navigator.userAgent);
}
