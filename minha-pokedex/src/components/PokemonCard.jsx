import React from 'react';

function PokemonCard({ pokemon, onClick }) {
    const formatId = (id) => String(id).padStart(3, '0');

    return (
        // Clicar no card abre os detalhes do Pokémon
        <div className="pokemon-card" onClick={() => onClick(pokemon)}>
            <img
                src={pokemon.sprites.front_default}
                alt={pokemon.name}
            />
            <p>#{formatId(pokemon.id)}</p>
            <h2>{pokemon.name}</h2>
            <div>
                {pokemon.types.map(typeInfo => (
                    <span
                        key={typeInfo.type.name}
                        className={`pokemon-type type-${typeInfo.type.name}`}
                    >
                        {typeInfo.type.name}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default PokemonCard;