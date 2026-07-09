import { AppShell } from './components/layout/AppShell';
import { ChatWindow } from './components/chat/ChatWindow';

export default function App() {
  return (
    <AppShell>
      <ChatWindow />
    </AppShell>
  );
}
