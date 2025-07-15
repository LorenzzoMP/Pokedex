// App.jsx
import React, { useState, useEffect } from 'react';
import './Pokedex.css';
import PokemonCard from './components/PokemonCard';
import PokemonDetailPanel from './components/PokemonDetailPanel';
import CustomTypeFilter from './components/CustomTypeFilter';
import { useLanguage } from './context/languageContext';


const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';
const POKEMON_LIST_LIMIT = 1025;
const PAGE_SIZE = 60;


function App() {
    const { t, toggleLanguage } = useLanguage();
    const [pokemonList, setPokemonList] = useState([]); // lista básica {name, url}
    const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
    const [displayedPokemon, setDisplayedPokemon] = useState([]); // [{name, url, ...detalhes}]
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Busca a lista de nomes/urls na inicialização
    useEffect(() => {
        async function fetchPokemonList() {
            setLoading(true);
            try {
                const res = await fetch(`${POKEAPI_BASE_URL}?limit=${POKEMON_LIST_LIMIT}`);
                const data = await res.json();
                setPokemonList(data.results); // [{name, url}]
            } catch {
                setPokemonList([]);
            } finally {
                setLoading(false);
            }
        }
        fetchPokemonList();
    }, []);

    // Função para buscar detalhes de um grupo de pokémons
    const fetchPokemonDetails = async (list) => {
        return await Promise.all(list.map(async (p) => {
            if (p.id && p.sprites) return p; // já tem detalhes
            try {
                const res = await fetch(p.url);
                if (!res.ok) return p;
                const data = await res.json();
                return { ...p, ...data };
            } catch {
                return p;
            }
        }));
    };

    // Carregamento inicial e filtros (não inclui displayedCount como dependência)
    useEffect(() => {
        if (pokemonList.length === 0) return;

        let filtered = pokemonList;
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

        if (lowerCaseSearchTerm) {
            filtered = filtered.filter(p =>
                p.name.includes(lowerCaseSearchTerm) ||
                (p.id && p.id.toString() === lowerCaseSearchTerm)
            );
        }

        // Reset quando há mudança na busca ou filtros
        setDisplayedCount(PAGE_SIZE);
        
        // Carrega os primeiros pokémon
        const initialPokemon = filtered.slice(0, PAGE_SIZE);
        
        setLoading(true);
        fetchPokemonDetails(initialPokemon).then((withDetails) => {
            let result = withDetails;
            if (selectedTypes.length > 0) {
                result = result.filter(pokemon => {
                    if (!pokemon.types) return false;
                    const pokemonTypes = pokemon.types.map(typeInfo => typeInfo.type.name);
                    return selectedTypes.every(selectedType => pokemonTypes.includes(selectedType));
                });
            }
            setDisplayedPokemon(result);
            setLoading(false);
        });
    }, [pokemonList, searchTerm, selectedTypes]);

    // Função para carregar mais pokémon
    const loadMorePokemon = async () => {
        setLoadingMore(true);
        
        let filtered = pokemonList;
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

        if (lowerCaseSearchTerm) {
            filtered = filtered.filter(p =>
                p.name.includes(lowerCaseSearchTerm) ||
                (p.id && p.id.toString() === lowerCaseSearchTerm)
            );
        }

        // Pega apenas os novos pokémon que ainda não foram carregados
        const newCount = displayedCount + PAGE_SIZE;
        const newPokemon = filtered.slice(displayedCount, newCount);
        
        if (newPokemon.length > 0) {
            try {
                const newPokemonWithDetails = await fetchPokemonDetails(newPokemon);
                
                // Aplica filtros de tipo nos novos pokémon
                let filteredNewPokemon = newPokemonWithDetails;
                if (selectedTypes.length > 0) {
                    filteredNewPokemon = newPokemonWithDetails.filter(pokemon => {
                        if (!pokemon.types) return false;
                        const pokemonTypes = pokemon.types.map(typeInfo => typeInfo.type.name);
                        return selectedTypes.every(selectedType => pokemonTypes.includes(selectedType));
                    });
                }
                
                // Adiciona os novos pokémon à lista existente
                setDisplayedPokemon(prev => [...prev, ...filteredNewPokemon]);
                setDisplayedCount(newCount);
            } catch (error) {
                console.error('Erro ao carregar mais pokémon:', error);
            }
        }
        
        setLoadingMore(false);
    };


    // Ao clicar, busca detalhes se não tiver
    const handlePokemonClick = async (pokemon) => {
        if (pokemon.id && pokemon.sprites) {
            setSelectedPokemon(pokemon);
            setIsPanelOpen(true);
        } else {
            setLoading(true);
            try {
                const res = await fetch(pokemon.url);
                const data = await res.json();
                setSelectedPokemon({ ...pokemon, ...data });
                setIsPanelOpen(true);
            } catch {
                setSelectedPokemon(pokemon);
                setIsPanelOpen(true);
            } finally {
                setLoading(false);
            }
        }
    };


    // Busca detalhes ao clicar na evolução
    const handleEvolutionClick = async (pokemonName) => {
        const poke = pokemonList.find(p => p.name === pokemonName);
        if (!poke) return;
        setLoading(true);
        try {
            const res = await fetch(poke.url);
            const data = await res.json();
            setSelectedPokemon({ ...poke, ...data });
            setIsPanelOpen(true);
        } catch {
            setSelectedPokemon(poke);
            setIsPanelOpen(true);
        } finally {
            setLoading(false);
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
        // Reset da paginação quando filtros mudam
        setDisplayedCount(PAGE_SIZE);
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
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setDisplayedCount(PAGE_SIZE); // resetar paginação ao buscar
                            }}
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
                {loading ? (
                    <p>{t('loadingPokemon')}</p>
                ) : displayedPokemon.length > 0 ? (
                    <>
                        {displayedPokemon.map(pokemon => (
                            <PokemonCard
                                key={pokemon.name}
                                pokemon={pokemon}
                                onClick={handlePokemonClick}
                            />
                        ))}
                        {(() => {
                            let filtered = pokemonList;
                            const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
                            if (lowerCaseSearchTerm) {
                                filtered = filtered.filter(p =>
                                    p.name.includes(lowerCaseSearchTerm) ||
                                    (p.id && p.id.toString() === lowerCaseSearchTerm)
                                );
                            }
                            
                            return displayedCount < filtered.length && (
                                <button 
                                    className="show-more-btn" 
                                    style={{gridColumn: '1/-1', margin: '20px auto', padding: '10px 30px', fontSize: '1.1em'}} 
                                    onClick={loadMorePokemon}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? t('loadingPokemon') : t('showMore')}
                                </button>
                            );
                        })()}
                    </>
                ) : (
                    <p>{t('noPokemonFound') || 'Nenhum Pokémon encontrado.'}</p>
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
                    onEvolutionClick={handleEvolutionClick}
                />
            )}
        </div>
    );
}

export default App;
