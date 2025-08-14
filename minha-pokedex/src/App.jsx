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
    const [pokemonList, setPokemonList] = useState([]);
    const [allPokemonDetails, setAllPokemonDetails] = useState([]);
    const [displayedPokemon, setDisplayedPokemon] = useState([]);
    const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [viewMode, setViewMode] = useState('all');

    const [favorites, setFavorites] = useState(() => {
        const savedFavorites = localStorage.getItem('pokemon-favorites');
        return savedFavorites ? JSON.parse(savedFavorites) : [];
    });

    useEffect(() => {
        localStorage.setItem('pokemon-favorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (pokemonId) => {
        setFavorites(prevFavorites => {
            if (prevFavorites.includes(pokemonId)) {
                return prevFavorites.filter(id => id !== pokemonId);
            } else {
                return [...prevFavorites, pokemonId];
            }
        });
    };

    useEffect(() => {
        async function fetchPokemonList() {
            setLoading(true);
            try {
                const res = await fetch(`${POKEAPI_BASE_URL}?limit=${POKEMON_LIST_LIMIT}`);
                const data = await res.json();
                setPokemonList(data.results);
            } catch (error) {
                console.error("Erro ao buscar a lista de Pokémon:", error);
                setPokemonList([]);
            } finally {
                setLoading(false);
            }
        }
        fetchPokemonList();
    }, []);

    const fetchPokemonDetails = async (list) => {
        const detailsPromises = list.map(p =>
            p.id && p.sprites ? Promise.resolve(p) : fetch(p.url).then(res => res.json())
        );
        return await Promise.all(detailsPromises);
    };

    useEffect(() => {
        if (pokemonList.length === 0) return;

        setLoading(true);
        const loadInitialPokemon = async () => {
            const initialPokemon = pokemonList.slice(0, PAGE_SIZE);
            const details = await fetchPokemonDetails(initialPokemon);
            setAllPokemonDetails(details);
            setDisplayedPokemon(details);
            setDisplayedCount(PAGE_SIZE);
            setLoading(false);
        };
        loadInitialPokemon();
    }, [pokemonList]);
    
    useEffect(() => {
        const applyFiltersAndViews = async () => {
            setLoading(true);
    
            if (viewMode === 'favorites') {
                if (favorites.length === 0) {
                    setDisplayedPokemon([]);
                } else {
                    const favoriteUrls = favorites.map(id => ({ url: `${POKEAPI_BASE_URL}${id}` }));
                    const details = await fetchPokemonDetails(favoriteUrls);
                    setDisplayedPokemon(details);
                }
                setLoading(false);
                return;
            }
    
            let filteredList = pokemonList;
            const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    
            if (selectedTypes.length > 0) {
                try {
                    const allTypesPromises = selectedTypes.map(type => 
                        fetch(`https://pokeapi.co/api/v2/type/${type}`)
                            .then(res => res.json())
                            .then(data => data.pokemon.map(p => p.pokemon.name))
                    );
                    const allTypesPokemonNames = await Promise.all(allTypesPromises);
                    const intersection = allTypesPokemonNames.reduce((acc, currentNames) => 
                        acc.filter(name => currentNames.includes(name))
                    );
                    filteredList = pokemonList.filter(p => intersection.includes(p.name));
                } catch (error) {
                    console.error("Erro ao filtrar por tipos:", error);
                    filteredList = [];
                }
            }
            
            if (lowerCaseSearchTerm) {
                filteredList = filteredList.filter(p => p.name.includes(lowerCaseSearchTerm));
            }
    
            if (selectedTypes.length > 0 || lowerCaseSearchTerm) {
                const details = await fetchPokemonDetails(filteredList);
                setDisplayedPokemon(details);
            } else {
                const paginatedPokemon = allPokemonDetails.slice(0, displayedCount);
                setDisplayedPokemon(paginatedPokemon);
            }
            
            setLoading(false);
        };
    
        applyFiltersAndViews();
    }, [viewMode, favorites, pokemonList, searchTerm, selectedTypes, displayedCount, allPokemonDetails]);
    
    const loadMorePokemon = async () => {
        if (selectedTypes.length > 0 || loadingMore || searchTerm) return;

        setLoadingMore(true);
        const newCount = displayedCount + PAGE_SIZE;
        const newPokemonUrls = pokemonList.slice(displayedCount, newCount);

        if (newPokemonUrls.length > 0) {
            try {
                const newPokemonWithDetails = await fetchPokemonDetails(newPokemonUrls);
                setAllPokemonDetails(prev => [...prev, ...newPokemonWithDetails]);
                setDisplayedPokemon(prev => [...prev, ...newPokemonWithDetails]);
                setDisplayedCount(newCount);
            } catch (error) {
                console.error('Erro ao carregar mais pokémon:', error);
            }
        }
        setLoadingMore(false);
    };

    const handlePokemonClick = async (pokemon) => {
        if (pokemon.id && pokemon.sprites) {
            setSelectedPokemon(pokemon);
        } else {
            setLoading(true);
            try {
                const res = await fetch(pokemon.url);
                const data = await res.json();
                setSelectedPokemon({ ...pokemon, ...data });
            } catch (error) {
                console.error('Erro ao buscar detalhes do Pokémon:', error);
                setSelectedPokemon(pokemon);
            } finally {
                setLoading(false);
            }
        }
        setIsPanelOpen(true);
    };

    const handleEvolutionClick = async (pokemonName) => {
        const poke = pokemonList.find(p => p.name === pokemonName);
        if (!poke) return;
        setIsPanelOpen(false);
        setTimeout(async () => {
            await handlePokemonClick(poke);
        }, 300);
    };
    
    const handleTypeChange = (type) => {
        setSelectedTypes(prevTypes => {
            if (type === '') return [];
            if (prevTypes.includes(type)) {
                return prevTypes.filter(t => t !== type);
            }
            return [...prevTypes, type].slice(0, 2);
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

                <div className="header-top-left-controls">
                    <div className="language-toggle">
                        <button onClick={toggleLanguage} title={t('toggleLanguage')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-translate" viewBox="0 0 16 16">
                                <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286z"/>
                                <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31"/>
                            </svg>
                        </button>
                    </div>
                    <div className="favorites-toggle">
                        <button
                            className={`toggle-button ${viewMode === 'favorites' ? 'active' : ''}`}
                            onClick={() => setViewMode(viewMode === 'favorites' ? 'all' : 'favorites')}
                            title={t('favorites')}
                        >
                            <span className="material-symbols-outlined">star_shine</span>
                        </button>
                    </div>
                </div>

                <div className="search-and-filter-area">
                    {/* A área de busca e filtro só aparece na visualização 'all' */}
                    {viewMode === 'all' && (
                        <>
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
                                <label htmlFor="type-filter">{t('types')}:</label>
                                <CustomTypeFilter
                                    types={pokemonTypesForFilter}
                                    selectedTypes={selectedTypes}
                                    onTypeChange={handleTypeChange}
                                />
                            </div>
                        </>
                    )}
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
                                onFavoriteToggle={toggleFavorite}
                                isFavorited={favorites.includes(pokemon.id)}
                            />
                        ))}
                        {viewMode === 'all' && displayedCount < pokemonList.length && selectedTypes.length === 0 && searchTerm === '' && (
                            <button
                                className="show-more-btn"
                                onClick={loadMorePokemon}
                                disabled={loadingMore}
                            >
                                {loadingMore ? t('loading') : t('showMore')}
                            </button>
                        )}
                    </>
                ) : (
                    viewMode === 'favorites' ? (
                            <div className="empty-state-message">
                                <h2>{t('noFavoritesFound')}</h2>
                                <p>{t('noFavoritesFoundHint')}</p>
                            </div>
                        ) : (
                            <p className="search-criteria-message">{t('noPokemonFoundCriteria')}</p>
                        )                
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