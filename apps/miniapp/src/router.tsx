import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import App from './app/app';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/hello',
    element: <div>hello programming</div>,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
