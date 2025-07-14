// src/components/CustomTypeFilter.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/languageContext';
import './CustomTypeFilter.css';

function CustomTypeFilter({ types, selectedTypes, onTypeChange }) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // Verifica se o clique foi em uma opção do dropdown
                const isOptionClick = event.target.closest('.options-list');
                if (!isOptionClick) {
                    setIsOpen(false);
                }
            }
        }
        
        function handleResize() {
            if (isOpen) {
                setIsOpen(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize);
        };
    }, [dropdownRef, isOpen]);

    const handleOptionClick = (type) => {
        onTypeChange(type);
        // Não fecha o dropdown para permitir seleção múltipla
    };

    const handleToggleDropdown = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    // Atualiza o texto para exibir múltiplos tipos selecionados
    const displaySelectedText = selectedTypes.length > 0
        ? selectedTypes.map(type => t(`type-${type}`) || type.charAt(0).toUpperCase() + type.slice(1)).join(', ')
        : t('allTypes');

    return (
        <div className="custom-select-container" ref={dropdownRef}>
            <div className="selected-value" onClick={handleToggleDropdown}>
                {displaySelectedText}
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
                <ul 
                    className="options-list"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width
                    }}
                >
                    {types.map(type => (
                        <li
                            key={type || 'all'}
                            // A classe 'selected' é aplicada se o tipo estiver no array de selecionados
                            className={`option-item ${selectedTypes.includes(type) ? 'selected' : ''}`}
                            onClick={() => handleOptionClick(type)}
                        >
                            {type ? (
                                <span className={`type-label type-${type}`}>
                                    {t(`type-${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                            ) : (
                                <span className="type-label type-all-types">
                                    {t('allTypes')}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CustomTypeFilter;
