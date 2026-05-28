import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppTDSProvider } from './providers/AppTDSProvider';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppTDSProvider>
      <App />
    </AppTDSProvider>
  </React.StrictMode>,
);
