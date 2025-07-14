import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from "./context/languageContext.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider> {/* Envolve o componente App com o LanguageProvider */}
      <App />
    </LanguageProvider>
  </StrictMode>,
);