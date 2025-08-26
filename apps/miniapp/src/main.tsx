import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { initSDK } from '@marketplace/telegram/react-sdk';
import { Router } from './router';
import { UnsupportedEnv } from './unsupportedENV';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

try {
  await initSDK({ isDev: true });
  root.render(
    <StrictMode>
      <Router />
    </StrictMode>
  );
} catch (error) {
  root.render(<UnsupportedEnv error={error} />);
}
