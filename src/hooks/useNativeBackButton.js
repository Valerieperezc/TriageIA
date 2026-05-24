import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNativeApp } from '../lib/nativeApp';

export function useNativeBackButton(fallbackPath = '/') {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeApp()) {
      return undefined;
    }

    let cancelled = false;
    let listenerHandle;

    import('@capacitor/app').then(({ App }) => {
      if (cancelled) {
        return undefined;
      }

      return App.addListener('backButton', () => {
        if (window.history.length > 1) {
          navigate(-1);
          return;
        }

        navigate(fallbackPath, { replace: true });
      }).then((handle) => {
        if (cancelled) {
          handle.remove();
          return;
        }

        listenerHandle = handle;
      });
    });

    return () => {
      cancelled = true;
      listenerHandle?.remove();
    };
  }, [fallbackPath, navigate]);
}
