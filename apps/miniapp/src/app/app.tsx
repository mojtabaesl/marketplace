import { Button, Input } from '@marketplace/ui';
import { Link } from 'react-router';

export function App() {
  return (
    <div>
      <Input />
      <Button>
        <Link to="/hello">hello</Link>
      </Button>
    </div>
  );
}
export default App;
