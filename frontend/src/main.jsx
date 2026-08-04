import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ThemeProvider } from './ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:!bg-wa-dsurf dark:!text-wa-dtext dark:!border-wa-dbdr',
          success: { style: { background: '#DCF8C6', color: '#075E54' } },
          error:   { style: { background: '#fee2e2', color: '#991b1b' } },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
