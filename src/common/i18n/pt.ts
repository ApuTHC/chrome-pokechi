import { Strings } from "./strings";

// Item and type names are the official Brazilian Portuguese localization
// (PokeAPI has no pt-br item/type data, so these are grounded against
// Bulbapedia's own "in other languages" tables instead) - Master Ball stays
// "Master Ball" like most languages, Rare Candy is "Doce Raro", and Premier
// Ball is "Bola Presenteada" (its own name here too, like Spanish's "Honor
// Ball" and French's "Honor Ball").
export const pt: Strings = {
  itemNames: {
    "rare-candy": "Doce Raro",
    "master-ball": "Master Ball",
    "premier-ball": "Bola Presenteada",
  },
  itemDescriptions: {
    "rare-candy":
      "Evolui instantaneamente seu pokémon atual, desde que ele ainda não esteja totalmente evoluído.",
    "master-ball":
      "Revela um Pokémon sub-lendário, lendário ou mítico aleatório de qualquer geração.",
    "premier-ball":
      "Revela um Pokémon aleatório como shiny, de qualquer geração ou raridade.",
  },
  typeAbbreviations: {
    normal: "NOR",
    fire: "FOG",
    water: "AGU",
    electric: "ELE",
    grass: "PLA",
    ice: "GEL",
    fighting: "LUT",
    poison: "VEN",
    ground: "TER",
    flying: "VOA",
    psychic: "PSI",
    bug: "INS",
    rock: "PED",
    ghost: "FAN",
    dragon: "DRA",
    dark: "SOM",
    steel: "ACO",
  },

  badgeEarned: (badgeName) => `🏅 Você conquistou a ${badgeName}!`,
  challengeEarned: (challengeName) => `🏆 Desafio concluído: ${challengeName}! +1 Bola Presenteada`,
  challengeNames: {
    "fire-master": "Mestre Fogo",
    "water-master": "Mestre Água",
    "leaf-master": "Mestre Folha",
    "classic-shiny": "Um Verdadeiro Clássico",
    "fighters": "Lutadores",
    "headaches": "Dores de Cabeça",
    "city-master": "Domine a Cidade",
    "catch-em-all": "Pegue Todos!",
    "brocks-heartbreak": "O Coração Partido de Brock",
    "rocket-motto": "Para Proteger o Mundo da Devastação",
    "joy-legacy": "O Legado da Enfermeira Joy",
    "electric-storm": "Tempestade Elétrica",
    "dragon-sanctuary": "Santuário do Dragão",
    "night-terror": "Terror Noturno",
    "outcast-club": "O Clube dos Rejeitados",
    "forest-plague": "Praga da Floresta",
  },

  catchNewPokemonConfirm:
    "Capturar um novo Pokémon? O que você tem agora será guardado - seu progresso é salvo e você pode trazê-lo de volta pelo Pokechidex.",
  catchNewPokemonButton: "Capturar um Novo Pokémon",

  useItemButton: (itemName) => `Usar ${itemName}`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 Sua ${itemName} revelou ${pokemonName}!`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ Sua ${itemName} revelou um ${pokemonName} shiny!`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ Sua ${itemName} revelou um ${pokemonName} shiny!`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "Progresso de XP",
  popupCaught: "Capturados",
  popupCandies: "Doces",
  popupPowerUps: "Bônus",
  popupPowerUpsEmpty: "Sem bônus ainda",
  popupPetVisible: "Mascote flutuante",
  popupCustomNewTab: "Nova aba personalizada",
  popupSoundEnabled: "Sons e gritos",
  popupScale: "Tamanho",
  popupLevelEgg: "Ovo",
  languageLabel: "Idioma",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "Nova aba",
  newtabSearchPlaceholder: "Buscar no Google...",
  newtabSearchButton: "Buscar",
  newtabFooter: "Seu companheiro Pokémon também vive nesta aba",
  newtabDisabledMessage:
    "Aba personalizada desativada — ative-a no popup do Pokechi.",
  newtabShowcaseTitle: "Clique para ver outro Pokémon",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "Ver no Pokechidex",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ Atividade!`,
    tab_event: (n) => `+${n} XP 📑 Aba!`,
    youtube_song: (n) => `+${n} XP 🎵 Música!`,
    gmail_read: (n) => `+${n} XP ✉️ E-mail lido!`,
    gmail_deleted: (n) => `+${n} XP 🗑️ Excluído!`,
    page_clicks: (n) => `+${n} XP 🖱️ Cliques!`,
    typing: (n) => `+${n} XP ⌨️ Digitação!`,
    rare_candy: (n) => `+${n} XP 🍬 Doce Raro!`,
    master_ball: (n) => `+${n} XP ⚪ Master Ball!`,
    premier_ball: (n) => `+${n} XP 🔴 Bola Presenteada!`,
    hatch: (n) => `+${n} XP 🥚 Eclodiu!`,
    evolution: () => `✨ Evolução!`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ Evolução!",
  xpMax: "XP MÁX",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle:
    "Coleção de Pokémon descobertos, medalhas e itens da sua mochila.",
  undiscoveredName: "???",
  counterDiscovered: "Descobertos",
  counterShiny: "Shiny",
  counterBadges: "Medalhas",
  counterTotalXP: "XP Total",
  candyCounterNoneYet: (itemName) =>
    `Você ainda não tem ${itemName} - eclodir uma Poké Bola tem uma pequena chance de dar um`,
  candyCounterNotUsableNow: (itemName) =>
    `Seu pokémon atual não pode usar um ${itemName} agora`,

  bagLabel: "Mochila",
  bagTabItems: "Itens",
  bagTabBadges: "Medalhas",
  bagTabChallenges: "Desafios",
  challengesEmpty: "Nenhum desafio concluído ainda — eles aparecem aqui quando conquistados.",
  challengeObjectives: {
    "fire-master": "Complete as 4 linhas de iniciais de fogo (Charizard, Typhlosion, Blaziken e Infernape).",
    "water-master": "Complete as 4 linhas de iniciais de água (Blastoise, Feraligatr, Swampert e Empoleon).",
    "leaf-master": "Complete as 4 linhas de iniciais de planta (Venusaur, Meganium, Sceptile e Torterra).",
    "classic-shiny": "Obtenha um Gyarados shiny.",
    "fighters": "Obtenha Hitmonlee e Hitmonchan.",
    "headaches": "Obtenha Mewtwo.",
    "city-master": "Complete todos os Pokémon de qualquer uma das gerações (concedido apenas na primeira vez que completar uma geração).",
    "catch-em-all": "Complete toda a Pokechidex (todos os Pokémon de todas as gerações).",
    "brocks-heartbreak": "Obtenha Onix, Steelix, Geodude e Sudowoodo.",
    "rocket-motto": "Obtenha Meowth, Arbok, Weezing e Seviper.",
    "joy-legacy": "Obtenha Togepi e Chansey.",
    "electric-storm": "Obtenha Pikachu, Electabuzz e Ampharos.",
    "dragon-sanctuary": "Obtenha Dragonite, Salamence e Garchomp.",
    "night-terror": "Obtenha Gengar, Misdreavus e Sableye.",
    "outcast-club": "Obtenha Rattata, Sentret, Zigzagoon e Bidoof.",
    "forest-plague": "Obtenha Butterfree, Scizor e Heracross.",
  },
  challengePowerUps: {
    "fire-master": "XP x2 se o Pokémon ativo for do tipo fogo",
    "water-master": "XP x2 se o Pokémon ativo for do tipo água",
    "leaf-master": "XP x2 se o Pokémon ativo for do tipo planta",
    "classic-shiny": "XP x2 se o Pokémon ativo for shiny",
    "fighters": "XP x2 se o Pokémon ativo for do tipo luta",
    "headaches": "XP x2 se o Pokémon ativo for do tipo psíquico",
    "city-master": "XP x2 sempre, com qualquer Pokémon em qualquer estado",
    "catch-em-all": "As próximas descobertas serão sempre shiny",
    "brocks-heartbreak": "XP x2 se o Pokémon ativo for do tipo pedra",
    "rocket-motto": "XP x2 se o Pokémon ativo for do tipo veneno",
    "joy-legacy": "XP x2 apenas enquanto o Pokémon estiver no estado Pokeball",
    "electric-storm": "XP x2 se o Pokémon ativo for do tipo elétrico",
    "dragon-sanctuary": "XP x2 se o Pokémon ativo for do tipo dragão",
    "night-terror": "XP x2 se o Pokémon ativo for do tipo fantasma",
    "outcast-club": "XP x2 se o Pokémon ativo for do tipo normal",
    "forest-plague": "XP x2 se o Pokémon ativo for do tipo inseto",
  },
  itemUseButton: "Usar",
  badgeStatusObtained: "Obtida",
  badgeStatusLocked: "Bloqueada",
  badgeGenerationLabel: (generation) => `Ger ${generation}`,

  requirementSpeciesDiscovered: "Espécies descobertas",
  requirementShinyDiscovered: "Shiny descobertos",
  requirementFossilsDiscovered: "Fósseis descobertos",
  requirementSubLegendariesDiscovered: "Sub-lendários descobertos",
  requirementLegendariesDiscovered: "Lendários descobertos",
  requirementMythicalsDiscovered: "Míticos descobertos",
  requirementRareCandiesUsed: "Doces Raros usados",

  searchPlaceholder: "Buscar por nome ou número",
  searchAriaLabel: "Buscar no Pokechidex",
  filtersAriaLabel: "Filtros do Pokedex",
  filterAll: "Todos",
  typeFilterLabel: "Tipo",
  typeFilterAriaLabel: "Filtrar por tipo",
  typeFilterClear: "Limpar",
  filterDiscoveredOnly: "Somente descobertos",
  filterShinyUnlocked: "Shiny desbloqueado",
  emptyState: "Nada corresponde a essa busca.",
  gridAriaLabel: "Grade do Pokechidex",

  cardShowLabel: (name) => `Mostrar ${name}`,
  cardShowLabelActive: (name) => `Mostrar ${name}, atualmente ativo`,
  cardUndiscoveredLabel: "Pokémon não descoberto",
  toggleShinyLabel: (name) => `Alternar sprite shiny de ${name}`,
  toggleShinyTitle: "Alternar sprite shiny",
  playCryLabel: (name) => `Tocar o grito de ${name}`,
  playCryTitle: "Tocar grito",
  showInfoLabel: (name) => `Mostrar informações de ${name}`,
  showMovesLabel: (name) => `Mostrar golpes de ${name}`,
  infoTitle: "Info",
  movesTitle: "Golpes",
  activeBadge: "Ativo",
};
