// PokemonDetailPanel.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/languageContext';
import pokeballIcon from '../assets/game.png';

// --- Componente Interno para o Conteúdo do Painel ---
const PokemonDetailContent = ({ pokemon, t, onEvolutionClick }) => {
    const [evolutionChain, setEvolutionChain] = useState(null);
    const [isShiny, setIsShiny] = useState(false); // Estado para controlar a forma shiny

    // Reseta o estado shiny quando o Pokémon muda
    useEffect(() => {
        setIsShiny(false);
    }, [pokemon]);

    const formatId = (id) => String(id).padStart(3, '0');

    // ... (funções de tradução permanecem as mesmas) ...
    const translateItemName = (itemName) => {
        const translationKey = `evo-item-${itemName.replace(/-/g, '')}`;
        const translated = t(translationKey);
        return translated !== translationKey ? translated : itemName.replace(/-/g, ' ');
    };

    const translateEvolutionCondition = (detail) => {
        const trigger = detail.trigger.name;
        let conditions = [];
        if (trigger === 'use-item' && detail.item) return `${t('evo-use')} ${translateItemName(detail.item.name)}`;
        if (trigger === 'trade') {
            if (detail.held_item) return `${t('evo-trade')} ${t('evo-holding')} ${translateItemName(detail.held_item.name)}`;
            if (detail.trade_species) return `${t('evo-tradeFor')} ${detail.trade_species.name.replace(/-/g, ' ')}`;
            return t('evo-trade');
        }
        if (trigger === 'level-up') {
            if (detail.min_level) conditions.push(`${t('evo-lvl')} ${detail.min_level}`);
            if (detail.time_of_day) conditions.push(t(`evo-time-${detail.time_of_day}`));
            if (conditions.length === 0) return t('evo-levelUp');
            return conditions.join(' / ');
        }
        return trigger.replace(/-/g, ' ');
    };

    const consolidateEvolutionConditions = (evolutionDetails) => {
        if (!evolutionDetails || evolutionDetails.length === 0) return t('evo-levelUp');
        const allConditions = evolutionDetails.map(detail => translateEvolutionCondition(detail));
        let uniqueConditions = [...new Set(allConditions)];
        if (uniqueConditions.length > 1) {
            uniqueConditions = uniqueConditions.filter(condA => !uniqueConditions.some(condB => condB.length > condA.length && condB.startsWith(condA)));
        }
        return uniqueConditions.join(' ou ');
    };


    useEffect(() => {
        const fetchEvolutionChainData = async () => {
            if (!pokemon?.species?.url) {
                setEvolutionChain(null);
                return;
            }
            try {
                const speciesResponse = await fetch(pokemon.species.url);
                const speciesData = await speciesResponse.json();
                const evoChainResponse = await fetch(speciesData.evolution_chain.url);
                const evoChainData = await evoChainResponse.json();

                const processEvolutionNode = async (node) => {
                    const pokemonDataResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${node.species.name}`);
                    const pokemonData = await pokemonDataResponse.json();
                    const evolutions = await Promise.all(node.evolves_to.map(async (nextEvo) => ({
                        to: await processEvolutionNode(nextEvo),
                        condition: consolidateEvolutionConditions(nextEvo.evolution_details),
                    })));
                    return { name: node.species.name, image: pokemonData.sprites.front_default, evolutions };
                };
                setEvolutionChain(await processEvolutionNode(evoChainData.chain));
            } catch (error) {
                console.error("Erro ao buscar cadeia de evolução:", error);
                setEvolutionChain(null);
            }
        };
        fetchEvolutionChainData();
    }, [pokemon]);

    const renderEvolutionTree = (node, currentPokemonName, onEvoClick) => {
        if (!node) return null;

        const baseCurrentName = currentPokemonName.split('-')[0];
        const isCurrent = node.name === baseCurrentName;
        const clickHandler = isCurrent ? () => {} : () => onEvoClick(node.name);

        // --- Caso Especial: Múltiplas Evoluções (ex: Eevee) ---
        if (node.evolutions?.length > 1) {
            return (
                <div className="evolution-tree-node-wrapper branching-evolution">
                    {/* Card do Pokémon base (que possui várias evoluções) */}
                    <div className={`evolution-stage-card ${isCurrent ? 'current-evolution-card' : ''}`} onClick={clickHandler}>
                        <img src={node.image} alt={node.name} />
                        <p className="evolution-name">{node.name}</p>
                    </div>

                    {/* A "seta mestra" foi REMOVIDA daqui. */}

                    {/* O grid agora contém a seta e a condição para CADA evolução. */}
                    <div className="evolution-branches-grid">
                        {node.evolutions.map((evo) => {
                            const evoIsCurrent = evo.to.name === baseCurrentName;
                            const evoClickHandler = evoIsCurrent ? () => {} : () => onEvoClick(evo.to.name);
                            
                            return (
                                <React.Fragment key={evo.to.name}>
                                    {/* Coluna 1: O grupo de seta + condição, igual ao da evolução linear */}
                                    <div className="evolution-arrow-and-condition">
                                        <span className="evolution-arrow">→</span>
                                        <p className="evolution-condition">{evo.condition}</p>
                                    </div>
                                    
                                    {/* Coluna 2: Card do Pokémon Evoluído */}
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

        // --- Caso Padrão: Evolução Linear (uma única evolução ou nenhuma) ---
        return (
            <div className="evolution-tree-node-wrapper linear-evolution">
                {/* Card do Pokémon atual na cadeia linear */}
                <div className={`evolution-stage-card ${isCurrent ? 'current-evolution-card' : ''}`} onClick={clickHandler}>
                    <img src={node.image} alt={node.name} />
                    <p className="evolution-name">{node.name}</p>
                </div>
                
                {/* Se houver uma próxima evolução, renderiza a seta e continua a cadeia */}
                {node.evolutions?.length === 1 && (
                    <>
                        <div className="evolution-arrow-and-condition">
                            <span className="evolution-arrow">→</span>
                            <p className="evolution-condition">{node.evolutions[0].condition}</p>
                        </div>
                        {/* A recursão continua aqui apenas para cadeias lineares */}
                        {renderEvolutionTree(node.evolutions[0].to, currentPokemonName, onEvoClick)}
                    </>
                )}
            </div>
        );
    };
    
    const artwork = pokemon.sprites.other['official-artwork'];
    const shinyArtworkUrl = artwork.front_shiny;
    const defaultArtworkUrl = artwork.front_default;

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

            {/* CONDIÇÃO ADICIONADA AQUI */}
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

// --- Componente Principal do Painel ---
function PokemonDetailPanel({ pokemon, onClose, onEvolutionClick }) {
    const { t } = useLanguage();
    const [forms, setForms] = useState([]);
    const [activeFormIndex, setActiveFormIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const getSmogonUrl = (pokemonName) => {
        const formattedName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `https://www.smogon.com/dex/ss/pokemon/${formattedName}/`;
    };

    useEffect(() => {
        const fetchForms = async () => {
            if (!pokemon) return;
            setIsLoading(true);
            try {
                const speciesResponse = await fetch(pokemon.species.url);
                const speciesData = await speciesResponse.json();
                if (speciesData.varieties?.length > 0) {
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
