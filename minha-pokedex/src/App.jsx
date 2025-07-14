// App.jsx
import React, { useState, useEffect } from 'react';
import './Pokedex.css';
import PokemonCard from './components/PokemonCard';
import PokemonDetailPanel from './components/PokemonDetailPanel';
import CustomTypeFilter from './components/CustomTypeFilter';
import { useLanguage } from './context/languageContext';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';
const FIRST_GEN_LIMIT = 1025;

function App() {
    const { t, toggleLanguage } = useLanguage();
    const [allPokemon, setAllPokemon] = useState([]);
    const [displayedPokemon, setDisplayedPokemon] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]);

    useEffect(() => {
        async function fetchPokemonData() {
            const pokemonList = [];
            for (let i = 1; i <= FIRST_GEN_LIMIT; i++) {
                try {
                    const response = await fetch(`${POKEAPI_BASE_URL}${i}`);
                    if (!response.ok) continue;
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

        if (selectedTypes.length > 0) {
            filtered = filtered.filter(pokemon => {
                const pokemonTypes = pokemon.types.map(typeInfo => typeInfo.type.name);
                return selectedTypes.every(selectedType => pokemonTypes.includes(selectedType));
            });
        }

        setDisplayedPokemon(filtered);
    }, [allPokemon, searchTerm, selectedTypes]);

    const handlePokemonClick = (pokemon) => {
        setSelectedPokemon(pokemon);
        setIsPanelOpen(true);
    };

    // FUNÇÃO REINTRODUZIDA: Lida com cliques nos cards da cadeia de evolução.
    const handleEvolutionClick = (pokemonName) => {
        const newSelectedPokemon = allPokemon.find(p => p.name === pokemonName);
        if (newSelectedPokemon) {
            setSelectedPokemon(newSelectedPokemon);
        } else {
            console.warn(`Pokémon "${pokemonName}" não encontrado na lista pré-carregada.`);
        }
    };
    
    const handleTypeChange = (type) => {
        if (type === '') {
            setSelectedTypes([]);
            return;
        }

        setSelectedTypes(prevTypes => {
            if (prevTypes.includes(type)) {
                return prevTypes.filter(t => t !== type);
            } else {
                if (prevTypes.length < 2) {
                    return [...prevTypes, type];
                }
            }
            return prevTypes;
        });
        setSearchTerm('');
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        setSelectedPokemon(null);
    };

    const allTypes = [
        'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
        'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy', 'dark'
    ];
    const sortedTypes = allTypes.sort((a, b) => a.localeCompare(b));
    const pokemonTypesForFilter = ['', ...sortedTypes];

    return (
        <div className={isPanelOpen ? 'app-container panel-open' : 'app-container'}>
            <header>
                 <h1>
                    PokéEgg
                    <span className="material-symbols-outlined logo-icon">egg</span>
                </h1>
                <div className="language-toggle">
                    <button onClick={toggleLanguage}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-translate" viewBox="0 0 16 16">
                            <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"/>
                            <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31"/>
                        </svg>
                    </button>
                </div>
                <div className="search-and-filter-area">
                    <div className="search-bar">
                        <input
                            type="text"
                            id="pokemon-search"
                            placeholder={t('searchPokemon')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-by-type">
                        <label htmlFor="type-filter">{t('allTypes')}:</label>
                        <CustomTypeFilter
                            types={pokemonTypesForFilter}
                            selectedTypes={selectedTypes}
                            onTypeChange={handleTypeChange}
                        />
                    </div>
                </div>
            </header>

            <main id="pokedex-list">
                {displayedPokemon.length > 0 ? (
                    displayedPokemon.map(pokemon => (
                        <PokemonCard
                            key={pokemon.id}
                            pokemon={pokemon}
                            onClick={handlePokemonClick}
                        />
                    ))
                ) : (
                    <p>{t('loadingPokemon')}</p>
                )}
            </main>

            <footer>
                <div>
                    <p>&copy; {t('developedBy')}</p>
                </div>
            </footer>

            {selectedPokemon && isPanelOpen && (
                <PokemonDetailPanel
                    pokemon={selectedPokemon}
                    onClose={closePanel}
                    // PROP REINTRODUZIDA: Passa a função para o painel de detalhes
                    onEvolutionClick={handleEvolutionClick}
                />
            )}
        </div>
    );
}

export default App;
