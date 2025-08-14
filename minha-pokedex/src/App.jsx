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
    // Hooks para o estado da aplicação
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

    // Efeito para buscar a lista de nomes/urls na inicialização
    useEffect(() => {
        async function fetchPokemonList() {
            setLoading(true);
            try {
                // Busca de todos os nomes e URLs dos Pokémon
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

    // Função para buscar detalhes de um grupo de pokémons
    const fetchPokemonDetails = async (list) => {
        const detailsPromises = list.map(p =>
            p.id && p.sprites ? Promise.resolve(p) : fetch(p.url).then(res => res.json())
        );
        return await Promise.all(detailsPromises);
    };

    // Efeito para carregar os Pokémon iniciais e gerenciar a paginação
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
    
    // Efeito para aplicar os filtros de busca e tipo
    useEffect(() => {
        if (pokemonList.length === 0) return;

        setLoading(true);
        const applyFilters = async () => {
            let filteredList = pokemonList;
            const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

            if (selectedTypes.length > 0) {
                const allTypesPromises = selectedTypes.map(type => 
                    fetch(`https://pokeapi.co/api/v2/type/${type}`)
                        .then(res => res.json())
                        .then(data => data.pokemon.map(p => p.pokemon.name))
                );

                try {
                    const allTypesPokemonNames = await Promise.all(allTypesPromises);
                    const intersection = allTypesPokemonNames.reduce((acc, currentNames) => {
                        return acc.filter(name => currentNames.includes(name));
                    });
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
        applyFilters();
    }, [pokemonList, searchTerm, selectedTypes, displayedCount]);
    
    // Função para carregar mais pokémon
    const loadMorePokemon = async () => {
        if (selectedTypes.length > 0 || loadingMore || searchTerm) return;

        setLoadingMore(true);

        const newCount = displayedCount + PAGE_SIZE;
        const newPokemonUrls = pokemonList.slice(displayedCount, newCount);

        if (newPokemonUrls.length > 0) {
            try {
                const newPokemonWithDetails = await fetchPokemonDetails(newPokemonUrls);
                setAllPokemonDetails(prev => [...prev, ...newPokemonWithDetails]);
                setDisplayedPokemon(prev => [...prev, ...newPokemonWithDetails]); // Atualiza displayedPokemon aqui também
                setDisplayedCount(newCount);
            } catch (error) {
                console.error('Erro ao carregar mais pokémon:', error);
            }
        }
        setLoadingMore(false);
    };

    // Função para lidar com o clique no card
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
            } catch (error) {
                console.error('Erro ao buscar detalhes do Pokémon:', error);
                setSelectedPokemon(pokemon);
                setIsPanelOpen(true);
            } finally {
                setLoading(false);
            }
        }
    };

    // Função para lidar com cliques na cadeia de evolução
    const handleEvolutionClick = async (pokemonName) => {
        const poke = pokemonList.find(p => p.name === pokemonName);
        if (!poke) return;
        setLoading(true);
        try {
            const res = await fetch(poke.url);
            const data = await res.json();
            setSelectedPokemon({ ...poke, ...data });
            setIsPanelOpen(true);
        } catch (error) {
            console.error('Erro ao buscar detalhes da evolução:', error);
            setSelectedPokemon(poke);
            setIsPanelOpen(true);
        } finally {
            setLoading(false);
        }
    };
    
    // Função para lidar com a mudança de tipo
    const handleTypeChange = (type) => {
        setSelectedTypes(prevTypes => {
            if (type === '') return [];
            
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

    // Fecha o painel de detalhes
    const closePanel = () => {
        setIsPanelOpen(false);
        setSelectedPokemon(null);
    };

    // Lista de todos os tipos para o filtro
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
                    <button onClick={toggleLanguage} title={t('toggleLanguage')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-translate" viewBox="0 0 16 16">
                            <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286z"/>
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
                            }}
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
                        {/* Botão para carregar mais */}
                        {displayedCount < pokemonList.length && selectedTypes.length === 0 && searchTerm === '' && (
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
                    <p>{searchTerm || selectedTypes.length > 0 ? t('noPokemonFoundCriteria') : t('noPokemonFound')}</p>
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
