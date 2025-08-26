import {
  setDebug,
  mountBackButton,
  restoreInitData,
  init as appsInit,
  bindThemeParamsCssVars,
  mountViewport,
  bindViewportCssVars,
  mockTelegramEnv,
  type ThemeParams,
  themeParamsState,
  retrieveLaunchParams,
  emitEvent,
  miniApp,
} from '@telegram-apps/sdk-react';

export interface InitialArgs {
  debug: boolean;
  platform: string;
  mockForMacOS: boolean;
}

function getInitialArgs(isDev: boolean): InitialArgs {
  const launchParams = retrieveLaunchParams();
  const { tgWebAppPlatform } = launchParams;
  const debug =
    isDev ||
    (launchParams.tgWebAppStartParam || '').includes('platformer_debug');

  return {
    debug,
    platform: tgWebAppPlatform,
    mockForMacOS: tgWebAppPlatform === 'macos',
  };
}

export async function initSDK(params: { isDev: boolean }): Promise<void> {
  const initialArgs = getInitialArgs(params.isDev);
  await init(initialArgs);
}

/**
 * Initializes the application and configures its dependencies.
 */
async function init(options: InitialArgs): Promise<void> {
  // Set @telegram-apps/sdk-react debug mode and initialize it.

  setDebug(options.debug);
  appsInit();

  // Add Eruda if needed.
  if (options.debug) {
    void import('eruda').then(({ default: eruda }) => {
      eruda.init();
      eruda.position({ x: window.innerWidth - 50, y: 0 });
    });
  }

  // Telegram for macOS has a ton of bugs, including cases, when the client doesn't
  // even response to the "web_app_request_theme" method. It also generates an incorrect
  // event for the "web_app_request_safe_area" method.
  if (options.mockForMacOS) {
    let firstThemeSent = false;
    mockTelegramEnv({
      onEvent(event, next) {
        if (event[0] === 'web_app_request_theme') {
          let tp: ThemeParams = {};
          if (firstThemeSent) {
            tp = themeParamsState();
          } else {
            firstThemeSent = true;
            tp ||= retrieveLaunchParams().tgWebAppThemeParams;
          }
          return emitEvent('theme_changed', { theme_params: tp });
        }

        if (event[0] === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          });
        }

        next();
      },
    });
  }

  // Mount all components used in the project.
  mountBackButton.ifAvailable();
  restoreInitData();

  if (miniApp.mountSync.isAvailable()) {
    miniApp.mountSync();
    bindThemeParamsCssVars();
  }

  mountViewport.isAvailable() &&
    mountViewport().then(() => {
      bindViewportCssVars();
    });
}
