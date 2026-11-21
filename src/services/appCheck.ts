import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

let appCheckInstance: AppCheck | null = null;

/** Uses Firebase's official debug-token flow in development and reCAPTCHA Enterprise in production. */
export function initAppCheck(app: FirebaseApp): AppCheck | null {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
  const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;

  if (import.meta.env.DEV) {
    (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string | boolean })
      .FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken?.trim() || true;
  }

  if (!recaptchaSiteKey?.trim()) {
    console.info('[CivicResolve] App Check is not initialized because VITE_RECAPTCHA_ENTERPRISE_SITE_KEY is not configured.');
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.info(
      `[CivicResolve] Firebase App Check initialized with reCAPTCHA Enterprise${import.meta.env.DEV ? ' debug-token support' : ''}.`
    );
  } catch (error) {
    console.warn('[CivicResolve] App Check initialization skipped/deferred:', error);
  }

  return appCheckInstance;
}

export function getAppCheckInstance(): AppCheck | null {
  return appCheckInstance;
}
