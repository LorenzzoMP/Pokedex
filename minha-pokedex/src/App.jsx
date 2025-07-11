// App.jsx
import React, { useState, useEffect } from 'react';
import './Pokedex.css';
import PokemonCard from './components/PokemonCard';
import PokemonDetailPanel from './components/PokemonDetailPanel';
import CustomTypeFilter from './components/CustomTypeFilter'; // Importa o novo componente de filtro

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';
const FIRST_GEN_LIMIT = 1025;

function App() {
    const [allPokemon, setAllPokemon] = useState([]);
    const [displayedPokemon, setDisplayedPokemon] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('');

    useEffect(() => {
        async function fetchPokemonData() {
            const pokemonList = [];
            for (let i = 1; i <= FIRST_GEN_LIMIT; i++) {
                try {
                    const response = await fetch(`${POKEAPI_BASE_URL}${i}`);
                    if (!response.ok) {
                        throw new Error(`Erro ao buscar Pokémon com ID ${i}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    pokemonList.push(data);
                } catch (error) {
                    console.error(`Erro ao buscar o Pokémon ${i}:`, error);
                }
            }
            setAllPokemon(pokemonList);
            setDisplayedPokemon(pokemonList);
        }
        fetchPokemonData();
    }, []);

    useEffect(() => {
        let filtered = [...allPokemon];

        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
        if (lowerCaseSearchTerm) {
            filtered = filtered.filter(pokemon =>
                pokemon.name.includes(lowerCaseSearchTerm) ||
                pokemon.id.toString() === lowerCaseSearchTerm
            );
        }

        if (selectedType) {
            filtered = filtered.filter(pokemon =>
                pokemon.types.some(typeInfo => typeInfo.type.name === selectedType)
            );
        }

        setDisplayedPokemon(filtered);
    }, [allPokemon, searchTerm, selectedType]);

    const handleSearch = () => {
        // A lógica de busca agora está no useEffect
    };

    const handleTypeChange = (type) => { // Alterado para receber diretamente o tipo
        setSelectedType(type);
        setSearchTerm('');
    };

    const handlePokemonClick = (pokemon) => {
        setSelectedPokemon(pokemon);
        setIsPanelOpen(true);
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        setSelectedPokemon(null);
    };

    const allTypes = [
        'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
        'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy'
    ];
    const sortedTypes = allTypes.sort((a, b) => a.localeCompare(b));
    const pokemonTypesForFilter = ['', ...sortedTypes]; // Renomeado para clareza

    return (
        <div className={isPanelOpen ? 'app-container panel-open' : 'app-container'}>
            <header>
                <h1>Pokédex</h1>
                <div className="search-and-filter-area">
                    <div className="search-bar">
                        <input
                            type="text"
                            id="pokemon-search"
                            placeholder="Buscar Pokémon por nome ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                        <button id="search-button" onClick={handleSearch}>Buscar</button>
                    </div>

                    <div className="filter-by-type">
                        <label htmlFor="type-filter">Filtrar por Tipo:</label>
                        {/* Substituímos o select nativo pelo CustomTypeFilter */}
                        <CustomTypeFilter
                            types={pokemonTypesForFilter}
                            selectedType={selectedType}
                            onTypeChange={handleTypeChange}
                        />
                    </div>
                </div>
            </header>

            <main id="pokedex-list">
                {allPokemon.length === 0 ? (
                    <p>Carregando Pokémon...</p>
                ) : displayedPokemon.length === 0 && (searchTerm || selectedType) ? (
                    <p>Nenhum Pokémon encontrado com os critérios de busca/filtro.</p>
                ) : displayedPokemon.length > 0 ? (
                    displayedPokemon.map(pokemon => (
                        <PokemonCard
                            key={pokemon.id}
                            pokemon={pokemon}
                            onClick={handlePokemonClick}
                        />
                    ))
                ) : (
                    <p>Nenhum Pokémon encontrado.</p>
                )}
            </main>

            <footer>
                <div>
                    <p>&copy; Desenvolvido por Lorenzzo_MP</p>
                </div>
            </footer>

            {selectedPokemon && isPanelOpen && (
                <PokemonDetailPanel
                    pokemon={selectedPokemon}
                    onClose={closePanel}
                />
            )}
        </div>
    );
}

export default App;
