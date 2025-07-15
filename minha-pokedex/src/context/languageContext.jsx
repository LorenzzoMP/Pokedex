// src/contexts/LanguageContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { translations } from '../translations'; // Importa suas traduções

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Estado inicial da linguagem é Português do Brasil (pt)
    const [language, setLanguage] = useState('pt');

    const toggleLanguage = () => {
        setLanguage(prevLang => (prevLang === 'pt' ? 'en' : 'pt'));
    };

    // Obter os textos traduzidos com base na linguagem atual
    const t = (key) => {
        return translations[language][key] || key; // Retorna a chave se a tradução não for encontrada
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export function useLanguage() {
    return useContext(LanguageContext);
}