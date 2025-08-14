// Em src/components/PokemonCard.jsx

import React from 'react';
import { useLanguage } from '../context/languageContext';

// Recebe as novas props: onFavoriteToggle e isFavorited
function PokemonCard({ pokemon, onClick, onFavoriteToggle, isFavorited }) {
    const { t } = useLanguage();
    const formattedId = String(pokemon.id).padStart(3, '0');

    const handleCardClick = () => {
        onClick(pokemon);
    };

    // Atualiza a função para chamar a prop recebida do App.jsx
    const handleFavoriteClick = (event) => {
        event.stopPropagation();
        onFavoriteToggle(pokemon.id);
    };

    return (
        <div className="pokemon-card" onClick={handleCardClick}>
            <button 
                className={`favorite-button ${isFavorited ? 'favorited' : ''}`} 
                onClick={handleFavoriteClick} 
                aria-label={`Favoritar ${pokemon.name}`}
            >
                <span className="material-symbols-outlined star-icon">star_shine</span>
            </button>
            <img src={pokemon.sprites?.front_default} alt={pokemon.name} className="pokemon-image" />
            <div className="pokemon-info">
                <span className="pokemon-id">#{formattedId}</span>
                <h3 className="pokemon-name">{pokemon.name.replace(/-/g, ' ')}</h3>
                <div className="pokemon-types">
                    {pokemon.types?.map(typeInfo => (
                        <span key={typeInfo.type.name} className={`pokemon-type type-${typeInfo.type.name}`}>
                            {t(`type-${typeInfo.type.name}`) || typeInfo.type.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PokemonCard;