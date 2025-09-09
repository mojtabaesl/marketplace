import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import App from './app/app';

const router = createHashRouter([
  {
    path: '/*',
    element: <App />,
    children: [
      {
        path: 'hello',
        element: <div>hello</div>,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
