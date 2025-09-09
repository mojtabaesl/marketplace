import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Router } from './router';
import { UnsupportedEnv } from './unsupportedEnv';
import { initSDK, mockTMAEnv } from '@marketplace/telegram/react-sdk';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

try {
  const isDev = import.meta.env.DEV;
  await mockTMAEnv({
    isDev,
    launchParams: import.meta.env.VITE_FAKE_LAUNCH_PARAMS,
  });
  await initSDK({ isDev });
  root.render(
    <StrictMode>
      <Router />
    </StrictMode>
  );
} catch (error) {
  root.render(<UnsupportedEnv error={error} />);
}
