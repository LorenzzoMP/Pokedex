import React from 'react';
import pokeballIcon from '../assets/game.png';

function PokemonDetailPanel({ pokemon, onClose }) {
    if (!pokemon) {
        return null; // Não renderiza nada se não houver Pokémon selecionado
    }

    const formatId = (id) => String(id).padStart(3, '0');

    // Função para gerar a URL do Smogon
    const getSmogonUrl = (pokemonName) => {
        // O Smogon geralmente usa nomes em minúsculas e sem espaços/hífens
        // para a URL. Ex: "charizard" ou "flabebe" (sem o traço para variantes).
        // Para simplificar, vamos remover espaços e hífens.
        const formattedName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `https://www.smogon.com/dex/ss/pokemon/${formattedName}/`;
    };

    return (
        // Painel de detalhes do Pokémon
        <div className="pokemon-detail-panel">
            {/* Botão para fechar com o ícone SVG */}
            <button className="close-button" onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-double-right" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708"/>
                    <path fillRule="evenodd" d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708"/>
                </svg>
            </button>

            {/* Novo botão para o Smogon */}
            <a
                href={getSmogonUrl(pokemon.name)}
                target="_blank" // Abre em uma nova aba
                rel="noopener noreferrer" // Boa prática de segurança
                className="smogon-button"
            >
                <img src={pokeballIcon} alt="Ir para Smogon" style={{ width: '30px', height: '30px' }} />
            </a>

            <div className="detail-content">
                <img
                    src={pokemon.sprites.other['official-artwork'].front_default} // Imagem maior e oficial
                    alt={pokemon.name}
                    className="detail-image"
                />
                <h2>{pokemon.name} <span className="detail-id">#{formatId(pokemon.id)}</span></h2>

                <div className="detail-types">
                    {pokemon.types.map(typeInfo => (
                        <span
                            key={typeInfo.type.name}
                            className={`pokemon-type type-${typeInfo.type.name}`}
                        >
                            {typeInfo.type.name}
                        </span>
                    ))}
                </div>

                <div className="detail-info-grid">
                    <p><strong>Altura:</strong> {pokemon.height / 10} m</p> {/* Converter para metros */}
                    <p><strong>Peso:</strong> {pokemon.weight / 10} kg</p> {/* Converter para quilogramas */}
                </div>

                <h3>Estatísticas Base</h3>
                <ul className="detail-stats">
                    {pokemon.stats.map(statInfo => (
                        <li key={statInfo.stat.name}>
                            <strong>{statInfo.stat.name.replace('-', ' ')}:</strong> {statInfo.base_stat}
                        </li>
                    ))}
                </ul>

                <h3>Habilidades</h3>
                <ul className="detail-abilities">
                    {pokemon.abilities.map(abilityInfo => (
                        <li key={abilityInfo.ability.name}>
                            {abilityInfo.ability.name.replace('-', ' ')}
                            {abilityInfo.is_hidden && ' (Oculta)'}
                        </li>
                    ))}
                </ul>

                {/* Você pode adicionar mais detalhes aqui, como movimentos, etc. */}
            </div>
        </div>
    );
}

export default PokemonDetailPanel;