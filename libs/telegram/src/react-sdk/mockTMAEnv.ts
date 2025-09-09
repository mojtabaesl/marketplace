import { mockTelegramEnv, isTMA, emitEvent } from '@telegram-apps/sdk-react';

function createThemeParams() {
  return {
    accent_text_color: '#6ab2f2',
    bg_color: '#17212b',
    button_color: '#5288c1',
    button_text_color: '#ffffff',
    destructive_text_color: '#ec3942',
    header_bg_color: '#17212b',
    hint_color: '#708499',
    link_color: '#6ab3f3',
    secondary_bg_color: '#232e3c',
    section_bg_color: '#17212b',
    section_header_text_color: '#6ab3f3',
    subtitle_text_color: '#708499',
    text_color: '#f5f5f5',
  } as const;
}

function createLaunchParams() {
  return new URLSearchParams([
    ['tgWebAppThemeParams', JSON.stringify(createThemeParams())],
    [
      'tgWebAppData',
      new URLSearchParams([
        ['auth_date', ((new Date().getTime() / 1000) | 0).toString()],
        ['hash', 'some-hash'],
        ['signature', 'some-signature'],
        ['user', JSON.stringify({ id: 1, first_name: 'John' })],
      ]).toString(),
    ],
    ['tgWebAppVersion', '8.4'],
    ['tgWebAppPlatform', 'tdesktop'],
  ]).toString();
}

export async function mockTMAEnv({
  isDev,
  launchParams = createLaunchParams(),
}: {
  isDev: boolean;
  launchParams?: string;
}) {
  if (!isDev) return;
  if (await isTMA('complete')) return;

  const themeParams = createThemeParams();

  const noInsets = { left: 0, top: 0, bottom: 0, right: 0 } as const;

  mockTelegramEnv({
    onEvent(e) {
      // Here you can write your own handlers for all known Telegram MIni Apps methods.
      if (e[0] === 'web_app_request_theme') {
        return emitEvent('theme_changed', { theme_params: themeParams });
      }
      if (e[0] === 'web_app_request_viewport') {
        return emitEvent('viewport_changed', {
          height: window.innerHeight,
          width: window.innerWidth,
          is_expanded: true,
          is_state_stable: true,
        });
      }
      if (e[0] === 'web_app_request_content_safe_area') {
        return emitEvent('content_safe_area_changed', noInsets);
      }
      if (e[0] === 'web_app_request_safe_area') {
        return emitEvent('safe_area_changed', noInsets);
      }
    },
    launchParams,
  });

  console.info(
    '⚠️ As long as the current environment was not considered as the Telegram-based one, it was mocked. Take a note, that you should not do it in production and current behavior is only specific to the development process. Environment mocking is also applied only in development mode. So, after building the application, you will not see this behavior and related warning, leading to crashing the application outside Telegram.'
  );
}
