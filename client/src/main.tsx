import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProviderWrapper } from './providers/WalletProvider';
import { ChatProvider } from './providers/ChatProvider';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProviderWrapper>
      <ChatProvider>
        <App />
      </ChatProvider>
    </WalletProviderWrapper>
  </React.StrictMode>,
);
