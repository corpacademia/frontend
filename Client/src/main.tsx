import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import axios from 'axios';
import React, { useEffect } from 'react';
import './index.css';
import { useBranding } from './hooks/useBranding';

axios.defaults.withCredentials = true;

const AppWithBranding = () => {
  useBranding();
  return <App />;
};

// Initialize theme immediately
const savedTheme = localStorage.getItem('theme-storage');
const theme = savedTheme ? JSON.parse(savedTheme).state.mode : 'dark';
document.documentElement.classList.add(theme);
document.documentElement.setAttribute('data-theme', theme);


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <AppWithBranding />
  // </StrictMode>
);