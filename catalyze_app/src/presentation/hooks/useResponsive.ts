import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

type Responsive = {
  width: number;
  height: number;
  isTablet: boolean;
  isLarge: boolean;
};

// Breakpoints chosen: tablet >= 768, large >= 1024
const TABLET_BREAKPOINT = 768;
const LARGE_BREAKPOINT = 1024;

export function useResponsive(): Responsive {
  const [size, setSize] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const handler = ({ window }: { window: ScaledSize }) => setSize(window);
    const sub = Dimensions.addEventListener ? Dimensions.addEventListener('change', handler) : null;
    // Backwards compat for older RN
    if (!sub) {
      const listener = Dimensions.addEventListener as unknown as any;
      // no-op; modern RN will handle above
    }
    return () => {
      try {
        if (sub && typeof (sub as any).remove === 'function') (sub as any).remove();
        // In RN >=0.65 Dimensions.addEventListener returns subscription
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const width = size.width;
  const height = size.height;
  const isTablet = width >= TABLET_BREAKPOINT;
  const isLarge = width >= LARGE_BREAKPOINT;

  return { width, height, isTablet, isLarge };
}

export default useResponsive;
