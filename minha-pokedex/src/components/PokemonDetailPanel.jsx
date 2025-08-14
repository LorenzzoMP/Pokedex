import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/languageContext';
import pokeballIcon from '../assets/game.png';

const PokemonDetailContent = ({ pokemon, t, onEvolutionClick }) => {
    const [evolutionChain, setEvolutionChain] = useState(null);
    const [typeEffectiveness, setTypeEffectiveness] = useState(null);
    const [isLoadingEffectiveness, setIsLoadingEffectiveness] = useState(true);
    const [isShiny, setIsShiny] = useState(false);

    useEffect(() => {
        setIsShiny(false);
        setTypeEffectiveness(null);
        setIsLoadingEffectiveness(true);
    }, [pokemon]);

    const formatId = (id) => String(id).padStart(3, '0');

    const translateItemName = (itemName) => {
        const translationKey = `evo-item-${itemName.replace(/-/g, '')}`;
        const translated = t(translationKey);
        return translated !== translationKey && translated ? translated : itemName.replace(/-/g, ' ');
    };

    const translateEvolutionCondition = (detail) => {
        const trigger = detail.trigger.name;

        if (trigger === 'use-item' && detail.item) {
            return `${t('evo-use')} ${translateItemName(detail.item.name)}`;
        }

        if (trigger === 'trade') {
            if (detail.held_item) return `${t('evo-trade')} ${t('evo-holding')} ${translateItemName(detail.held_item.name)}`;
            if (detail.trade_species) return `${t('evo-tradeFor')} ${detail.trade_species.name.replace(/-/g, ' ')}`;
            return t('evo-trade');
        }

        if (trigger === 'level-up') {
            const conditions = [];
            if (detail.min_level) conditions.push(`${t('evo-lvl')} ${detail.min_level}`);
            if (detail.min_happiness) conditions.push(`${t('evo-withHappiness')} ${detail.min_happiness}`);
            if (detail.min_affection) conditions.push(`${t('evo-withAffection')} ${detail.min_affection}`);
            if (detail.min_beauty) conditions.push(`${t('evo-withBeauty')} ${detail.min_beauty}`);
            if (detail.time_of_day) conditions.push(t(`evo-time-${detail.time_of_day}`));
            if (detail.known_move) conditions.push(`${t('evo-knowing')} ${detail.known_move.name.replace(/-/g, ' ')}`);
            if (detail.held_item) conditions.push(`${t('evo-holding')} ${translateItemName(detail.held_item.name)}`);
            if (detail.location) conditions.push(`${t('evo-atLocation')} ${detail.location.name.replace(/-/g, ' ')}`);
            if (detail.needs_overworld_rain) conditions.push(t('evo-inRain'));
            if (detail.gender === 1) conditions.push(t('evo-female'));
            if (detail.gender === 2) conditions.push(t('evo-male'));
            
            if (conditions.length === 0) return t('evo-levelUp');
            
            return conditions.join(' / ');
        }
        
        return trigger.replace(/-/g, ' ');
    };

    const consolidateEvolutionConditions = (evolutionDetails) => {
        if (!evolutionDetails || evolutionDetails.length === 0) return '';
        const allConditions = evolutionDetails.map(detail => translateEvolutionCondition(detail));
        const uniqueConditions = [...new Set(allConditions)];
        return uniqueConditions.join(' ou ');
    };

    useEffect(() => {
        if (!pokemon?.types) return;

        const controller = new AbortController();
        const { signal } = controller;

        const fetchEffectivenessData = async () => {
            setIsLoadingEffectiveness(true);
            try {
                const typePromises = pokemon.types.map(typeInfo =>
                    fetch(typeInfo.type.url, { signal }).then(res => res.json())
                );
                const typesData = await Promise.all(typePromises);

                const combined = {};
                typesData.forEach(typeData => {
                    const { damage_relations } = typeData;
                    damage_relations.double_damage_from.forEach(rel => { combined[rel.name] = (combined[rel.name] || 1) * 2; });
                    damage_relations.half_damage_from.forEach(rel => { combined[rel.name] = (combined[rel.name] || 1) * 0.5; });
                    damage_relations.no_damage_from.forEach(rel => { combined[rel.name] = 0; });
                });

                const finalEffectiveness = Object.fromEntries(Object.entries(combined).filter(([, mult]) => mult !== 1));
                setTypeEffectiveness(finalEffectiveness);

            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Falha ao calcular eficácia de tipos:", error);
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoadingEffectiveness(false);
                }
            }
        };

        fetchEffectivenessData();

        return () => {
            controller.abort();
        };
    }, [pokemon]);

    useEffect(() => {
        if (!pokemon?.species?.url) return;

        const controller = new AbortController();
        const { signal } = controller;

        const fetchEvolutionChainData = async () => {
            setEvolutionChain(null);
            try {
                const speciesResponse = await fetch(pokemon.species.url, { signal });
                const speciesData = await speciesResponse.json();
                const evoChainResponse = await fetch(speciesData.evolution_chain.url, { signal });
                const evoChainData = await evoChainResponse.json();

                const processEvolutionNode = async (node) => {
                    const pokemonDataResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${node.species.name}`, { signal });
                    const pokemonData = await pokemonDataResponse.json();
                    
                    const evolutions = await Promise.all(node.evolves_to.map(async (nextEvo) => ({
                        to: await processEvolutionNode(nextEvo),
                        condition: consolidateEvolutionConditions(nextEvo.evolution_details),
                    })));

                    return { 
                        name: node.species.name, 
                        image: pokemonData.sprites.front_default, 
                        evolutions 
                    };
                };
                setEvolutionChain(await processEvolutionNode(evoChainData.chain));
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Erro ao buscar cadeia de evolução:", error);
                    setEvolutionChain(null);
                }
            }
        };

        fetchEvolutionChainData();

        return () => {
            controller.abort();
        };
    }, [pokemon, t]);

    const renderEvolutionTree = (node, currentPokemonName, onEvoClick) => {
        if (!node) return null;

        const baseCurrentName = currentPokemonName.split('-')[0];
        const isCurrent = node.name === baseCurrentName;
        const clickHandler = isCurrent ? () => {} : () => onEvoClick(node.name);

        if (node.evolutions?.length > 1) {
            return (
                <div className="evolution-tree-node-wrapper branching-evolution">
                    <div className={`evolution-stage-card ${isCurrent ? 'current-evolution-card' : ''}`} onClick={clickHandler}>
                        <img src={node.image} alt={node.name} />
                        <p className="evolution-name">{node.name}</p>
                    </div>
                    <div className="evolution-branches-grid">
                        {node.evolutions.map((evo) => {
                            const evoIsCurrent = evo.to.name === baseCurrentName;
                            const evoClickHandler = evoIsCurrent ? () => {} : () => onEvoClick(evo.to.name);
                            
                            return (
                                <React.Fragment key={evo.to.name}>
                                    <div className="evolution-arrow-and-condition">
                                        <span className="evolution-arrow">→</span>
                                        <p className="evolution-condition">{evo.condition}</p>
                                    </div>
                                    <div className={`evolution-stage-card ${evoIsCurrent ? 'current-evolution-card' : ''}`} onClick={evoClickHandler}>
                                        <img src={evo.to.image} alt={evo.to.name} />
                                        <p className="evolution-name">{evo.to.name}</p>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className="evolution-tree-node-wrapper linear-evolution">
                <div className={`evolution-stage-card ${isCurrent ? 'current-evolution-card' : ''}`} onClick={clickHandler}>
                    <img src={node.image} alt={node.name} />
                    <p className="evolution-name">{node.name}</p>
                </div>
                {node.evolutions?.length === 1 && (
                    <>
                        <div className="evolution-arrow-and-condition">
                            <span className="evolution-arrow">→</span>
                            <p className="evolution-condition">{node.evolutions[0].condition}</p>
                        </div>
                        {renderEvolutionTree(node.evolutions[0].to, currentPokemonName, onEvoClick)}
                    </>
                )}
            </div>
        );
    };
    
    const artwork = pokemon.sprites.other['official-artwork'];
    const shinyArtworkUrl = artwork.front_shiny;
    const defaultArtworkUrl = artwork.front_default;

    const weaknesses = typeEffectiveness ? Object.entries(typeEffectiveness).filter(([, mult]) => mult > 1) : [];
    const resistances = typeEffectiveness ? Object.entries(typeEffectiveness).filter(([, mult]) => mult < 1 && mult > 0) : [];
    const immunities = typeEffectiveness ? Object.entries(typeEffectiveness).filter(([, mult]) => mult === 0) : [];

    return (
        <div className="detail-content">
            <div className="detail-image-container">
                <img 
                    src={isShiny ? (shinyArtworkUrl || defaultArtworkUrl) : defaultArtworkUrl} 
                    alt={pokemon.name} 
                    className="detail-image" 
                />
                {shinyArtworkUrl && (
                    <button 
                        className={`shiny-toggle-btn ${isShiny ? 'active' : ''}`} 
                        onClick={() => setIsShiny(!isShiny)}
                        aria-label="Toggle Shiny"
                        title="Toggle Shiny"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-stars" viewBox="0 0 16 16">
                            <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
                        </svg>
                    </button>
                )}
            </div>

            <h2>{pokemon.name.replace(/-/g, ' ')} <span className="detail-id">#{formatId(pokemon.id)}</span></h2>
            <div className="detail-types">
                {pokemon.types.map(typeInfo => (
                    <span key={typeInfo.type.name} className={`pokemon-type type-${typeInfo.type.name}`}>
                        {t(`type-${typeInfo.type.name}`) || typeInfo.type.name}
                    </span>
                ))}
            </div>
            <div className="detail-info-grid">
                <p><strong>{t('height')}</strong> {pokemon.height / 10} m</p>
                <p><strong>{t('weight')}</strong> {pokemon.weight / 10} kg</p>
            </div>
            
            {isLoadingEffectiveness ? (
                <p>{t('loading')}</p>
            ) : (
                (weaknesses.length > 0 || resistances.length > 0 || immunities.length > 0) && (
                    <div className="type-effectiveness-section">
                        <div className="type-effectiveness-grid">
                            {weaknesses.length > 0 && (
                                <div className="effectiveness-category">
                                    <h3>{t('weaknesses')}</h3>
                                    <div className="types-container">
                                        {weaknesses.map(([type, mult]) => (
                                            <span key={type} className={`pokemon-type type-${type}`}>{t(`type-${type}`) || type} ({mult}x)</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {resistances.length > 0 && (
                                <div className="effectiveness-category">
                                    <h3>{t('resistances')}</h3>
                                    <div className="types-container">
                                        {resistances.map(([type, mult]) => (
                                            <span key={type} className={`pokemon-type type-${type}`}>{t(`type-${type}`) || type} ({mult}x)</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {immunities.length > 0 && (
                                <div className="effectiveness-category">
                                    <h3>{t('immunities')}</h3>
                                    <div className="types-container">
                                        {immunities.map(([type]) => (
                                            <span key={type} className={`pokemon-type type-${type}`}>{t(`type-${type}`) || type} (0x)</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}

            <h3>{t('baseStats')}</h3>
            <ul className="detail-stats">
                {pokemon.stats.map(statInfo => (
                    <li key={statInfo.stat.name}>
                        <strong>{t(`stat-${statInfo.stat.name}`)}:</strong> {statInfo.base_stat}
                    </li>
                ))}
            </ul>
            <h3>{t('abilities')}</h3>
            <ul className="detail-abilities">
                {pokemon.abilities.map(abilityInfo => (
                    <li key={abilityInfo.ability.name}>
                        {abilityInfo.ability.name.replace('-', ' ')}
                        {abilityInfo.is_hidden && ` ${t('hidden')}`}
                    </li>
                ))}
            </ul>

            {evolutionChain && evolutionChain.evolutions && evolutionChain.evolutions.length > 0 && (
                <>
                    <h3>{t('evolutionChain')}</h3>
                    <div className="evolution-section">
                        <div className="evolution-tree-container">
                            {renderEvolutionTree(evolutionChain, pokemon.name, onEvolutionClick)}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

function PokemonDetailPanel({ pokemon, onClose, onEvolutionClick }) {
    const { t } = useLanguage();
    const [forms, setForms] = useState([]);
    const [activeFormIndex, setActiveFormIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const getSmogonUrl = (pokemonName) => {
        const formattedName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `https://www.smogon.com/dex/sv/pokemon/${formattedName}/`;
    };

    useEffect(() => {
        const fetchForms = async () => {
            if (!pokemon) return;
            setIsLoading(true);
            try {
                const speciesResponse = await fetch(pokemon.species.url);
                const speciesData = await speciesResponse.json();
                if (speciesData.varieties?.length > 1) {
                    const formsData = await Promise.all(
                        speciesData.varieties.map(v => fetch(v.pokemon.url).then(res => res.json()))
                    );
                    setForms(formsData);
                    const initialIndex = formsData.findIndex(f => f.name === pokemon.name);
                    setActiveFormIndex(initialIndex !== -1 ? initialIndex : 0);
                } else {
                    setForms([pokemon]);
                    setActiveFormIndex(0);
                }
            } catch (error) {
                console.error("Falha ao buscar formas do Pokémon", error);
                setForms([pokemon]);
                setActiveFormIndex(0);
            } finally {
                setIsLoading(false);
            }
        };
        fetchForms();
    }, [pokemon]);

    const getFormName = (name) => {
        if (name.includes('-mega-x')) return 'Mega X';
        if (name.includes('-mega-y')) return 'Mega Y';
        if (name.includes('-mega')) return 'Mega';
        if (name.includes('-gmax')) return 'Gmax';
        if (name.includes('-alola')) return 'Alola';
        if (name.includes('-galar')) return 'Galar';
        if (name.includes('-hisui')) return 'Hisui';
        if (name.includes('-paldea')) return 'Paldea';
        return 'Normal';
    };

    const pokemonToDisplay = forms[activeFormIndex];

    return (
        <div className="pokemon-detail-panel">
            <button className="close-button" onClick={onClose}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-double-left" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                    <path fillRule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                </svg>
            </button>
            {pokemonToDisplay && (
                <a href={getSmogonUrl(pokemonToDisplay.name)} target="_blank" rel="noopener noreferrer" className="smogon-button">
                    <img src={pokeballIcon} alt="Smogon" style={{ width: '20px', height: '20px' }} />
                </a>
            )}
            {forms.length > 1 && (
                <div className="form-tabs">
                    {forms.map((form, index) => (
                        <button key={form.name} className={`form-tab ${index === activeFormIndex ? 'active' : ''}`} onClick={() => setActiveFormIndex(index)}>
                            <span className="form-tab-text">{getFormName(form.name)}</span>
                        </button>
                    ))}
                </div>
            )}
            {isLoading ? <p>{t('loadingPokemon')}</p> : pokemonToDisplay ? (
                <PokemonDetailContent pokemon={pokemonToDisplay} t={t} onEvolutionClick={onEvolutionClick} />
            ) : <p>{t('noPokemonFound')}</p>}
        </div>
    );
}

export default PokemonDetailPanel;