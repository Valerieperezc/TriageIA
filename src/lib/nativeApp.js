import { Capacitor } from '@capacitor/core';

let initialized = false;

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function initNativeApp() {
  if (initialized || !isNativeApp()) {
    return;
  }

  initialized = true;

  const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }] =
    await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/keyboard'),
    ]);

  document.documentElement.classList.add('native-app');

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
  } catch {
    // StatusBar is unavailable on some platforms or web previews.
  }

  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch {
    // Keyboard plugin is optional on web.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash may already be hidden.
  }
}
