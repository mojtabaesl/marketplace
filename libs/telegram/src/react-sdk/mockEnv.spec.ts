import { mockTMAEnv } from './mockTMAEnv.js';

const mockTelegramEnvMock = vi.hoisted(() => vi.fn());
const isTMAMock = vi.hoisted(() => vi.fn());
const emitEventMock = vi.hoisted(() => vi.fn());

vi.mock('@telegram-apps/sdk-react', () => {
  return {
    mockTelegramEnv: mockTelegramEnvMock,
    isTMA: isTMAMock,
    emitEvent: emitEventMock,
  };
});

describe('Telegram Miniapp Environment Mocking', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('In Development', () => {
    const isDev = true;
    it('Should not mock in real telegram environment', async () => {
      isTMAMock.mockResolvedValue(true);
      await mockTMAEnv({ isDev });
      expect(mockTelegramEnvMock).not.toHaveBeenCalled();
    });

    it('Should forward a custom launchParams when provided', async () => {
      isTMAMock.mockResolvedValue(false);

      const customLaunchParams = 'tgWebAppVersion=9.0&tgWebAppPlatform=ios';
      await mockTMAEnv({ isDev, launchParams: customLaunchParams });

      expect(mockTelegramEnvMock).toHaveBeenCalledWith({
        launchParams: customLaunchParams,
        onEvent: expect.anything(),
      });
    });
  });

  describe('In Production', () => {
    const isDev = false;
    it('Should not mock environment at all', async () => {
      await mockTMAEnv({ isDev });
      expect(mockTelegramEnvMock).not.toHaveBeenCalled();
    });
  });
});
