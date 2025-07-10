// src/components/CustomTypeFilter.jsx
import React, { useState, useRef, useEffect } from 'react';
import './CustomTypeFilter.css';

function CustomTypeFilter({ types, selectedType, onTypeChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fecha o dropdown se clicar fora dele
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const handleOptionClick = (type) => {
        onTypeChange(type);
        setIsOpen(false);
    };

    const displaySelectedText = selectedType
        ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1)
        : 'Todos os Tipos';

    return (
        <div className="custom-select-container" ref={dropdownRef}>
            <div className="selected-value" onClick={() => setIsOpen(!isOpen)}>
                {displaySelectedText}
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
                <ul className="options-list">
                    {types.map(type => (
                        <li
                            key={type || 'all'}
                            className={`option-item ${selectedType === type ? 'selected' : ''}`}
                            onClick={() => handleOptionClick(type)}
                        >
                            {type ? (
                                <span className={`type-label type-${type}`}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                            ) : (
                                <span className="type-label type-all-types"> {/* Nova classe para "Todos os Tipos" */}
                                    Todos os Tipos
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