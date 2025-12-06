import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';
import React, { useEffect } from 'react';
import './index.css';
import { useBranding } from './hooks/useBranding';

axios.defaults.withCredentials = true;

const AppWithBranding = () => {
  useBranding();
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <AppWithBranding />
  // </StrictMode>
);