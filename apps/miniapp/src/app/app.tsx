import { useLaunchParams } from '@marketplace/telegram/react-sdk';
import { Button, Input } from '@marketplace/ui';
import { Link } from 'react-router';

export function App() {
  const launchParams = useLaunchParams(true);
  return (
    <div>
      <Input />
      <Button>
        <Link to="/hello">hello</Link>
      </Button>
      <ul>
        <li>platform: {launchParams.tgWebAppPlatform}</li>
        <li>name: {launchParams.tgWebAppData?.user?.firstName}</li>
      </ul>
    </div>
  );
}
export default App;
