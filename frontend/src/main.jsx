import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import { installGlobalErrorHandlers, rootErrorHandlers } from './utils/errorLogger.js';
import './styles/global.css';

installGlobalErrorHandlers();

createRoot(document.getElementById('root'), rootErrorHandlers).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
