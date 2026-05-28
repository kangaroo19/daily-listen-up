import type { PropsWithChildren } from 'react';
import { TDSMobileProvider } from '@toss/tds-mobile';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';

function isTossWebView() {
  return /Toss|AppsInToss|AIT/i.test(window.navigator.userAgent);
}

export function AppTDSProvider({ children }: PropsWithChildren) {
  if (isTossWebView()) {
    return <TDSMobileAITProvider>{children}</TDSMobileAITProvider>;
  }

  return (
    <TDSMobileProvider
      userAgent={{
        isAndroid: false,
        isIOS: false,
        fontA11y: undefined,
        fontScale: 100,
        colorPreference: 'light',
      }}
    >
      {children}
    </TDSMobileProvider>
  );
}
