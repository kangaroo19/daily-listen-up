import { useEffect, useRef } from 'react';
import { attachTossBannerAd } from '../integrations/tossBannerAds';

export function TossBannerAd() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    let attachedBanner: { destroy: () => void } | null = null;
    let isUnmounted = false;

    if (container == null) {
      return;
    }

    void attachTossBannerAd(container).then((result) => {
      if (isUnmounted) {
        result?.destroy();
        return;
      }

      attachedBanner = result;
    });

    return () => {
      isUnmounted = true;
      attachedBanner?.destroy();
    };
  }, []);

  return <div ref={containerRef} className="toss-banner-ad-slot" aria-hidden="true" />;
}
