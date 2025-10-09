import React, { type ComponentType } from 'react';

// Return a React component that delegates to nativewind's createInteropElement when available.
// Some nativewind builds may export helper factories or objects; wrapping ensures the returned
// value is always a callable React component usable in JSX.
export function interop<P extends Record<string, unknown> = any>(Component: ComponentType<P>) {
  const Wrapper: React.FC<P & { className?: string }> = (props) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nw: any = require('nativewind');
      if (nw && typeof nw.createInteropElement === 'function') {
        const C = nw.createInteropElement(Component as any);
        // If createInteropElement returns a component constructor/function
        if (typeof C === 'function') {
          return React.createElement(C as any, props as any);
        }
        // If it returns a React element instance, clone it with new props
        if (React.isValidElement(C)) {
          return React.cloneElement(C as any, props as any);
        }
        // If it returns an object with a default export (common interop shape), try that
        if (C && typeof C === 'object' && (typeof (C as any).default === 'function' || React.isValidElement((C as any).default))) {
          const D = (C as any).default;
          if (typeof D === 'function') return React.createElement(D as any, props as any);
          if (React.isValidElement(D)) return React.cloneElement(D as any, props as any);
        }
      }
    } catch (e) {
      // ignore and fall back to original
    }
    const Orig: any = Component;
    return React.createElement(Orig as any, props as any);
  };

  // Preserve displayName for easier debugging
  Wrapper.displayName = `interop(${Component.displayName || Component.name || 'Component'})`;
  return Wrapper;
}
