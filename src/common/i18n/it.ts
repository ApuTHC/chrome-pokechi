import { Strings } from "./strings";

// Item and type names are the official Italian localization used in the
// games themselves (verified via PokeAPI's item.names/type.names) - Master
// Ball and Premier Ball both keep their English names here, unlike Spanish
// and French's "Honor Ball", and Rare Candy is "Caramella rara".
export const it: Strings = {
  itemNames: {
    "rare-candy": "Caramella rara",
    "master-ball": "Master Ball",
    "premier-ball": "Premier Ball",
  },
  itemDescriptions: {
    "rare-candy":
      "Fa evolvere istantaneamente il tuo pokémon attuale, purché non sia già completamente evoluto.",
    "master-ball":
      "Rivela un Pokémon sub-leggendario, leggendario o mitico casuale di qualsiasi generazione.",
    "premier-ball":
      "Rivela un Pokémon casuale come shiny, di qualsiasi generazione o rarità.",
  },
  // The official in-game Italian abbreviations, matching the full type
  // names verified via PokeAPI's type.names (Fuoco, Acqua, Elettro, Erba,
  // Lotta, Coleottero, Roccia, Spettro, Acciaio...).
  typeAbbreviations: {
    normal: "NOR",
    fire: "FUO",
    water: "ACQ",
    electric: "ELE",
    grass: "ERB",
    ice: "GHI",
    fighting: "LOT",
    poison: "VEL",
    ground: "TER",
    flying: "VOL",
    psychic: "PSI",
    bug: "COL",
    rock: "ROC",
    ghost: "SPE",
    dragon: "DRA",
    dark: "BUI",
    steel: "ACC",
  },

  badgeEarned: (badgeName) => `🏅 Hai ottenuto il badge ${badgeName}!`,
  challengeEarned: (challengeName) => `🏆 Sfida completata: ${challengeName}! +1 Premier Ball`,

  catchNewPokemonConfirm:
    "Catturare un nuovo Pokémon? Quello che hai attualmente verrà messo da parte - i suoi progressi vengono salvati e puoi farlo uscire di nuovo dal Pokechidex.",
  catchNewPokemonButton: "Cattura un Nuovo Pokémon",

  useItemButton: (itemName) => `Usa ${itemName}`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 La tua ${itemName} ha rivelato ${pokemonName}!`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ La tua ${itemName} ha rivelato un ${pokemonName} shiny!`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ La tua ${itemName} ha rivelato un ${pokemonName} shiny!`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "Progresso XP",
  popupCaught: "Catturati",
  popupCandies: "Caramelle",
  popupPowerUps: "Potenziamenti",
  popupPowerUpsEmpty: "Nessun potenziamento ancora",
  popupPetVisible: "Mascotte fluttuante",
  popupCustomNewTab: "Nuova scheda personalizzata",
  popupSoundEnabled: "Suoni e versi",
  popupScale: "Dimensione",
  popupLevelEgg: "Uovo",
  languageLabel: "Lingua",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "Nuova scheda",
  newtabSearchPlaceholder: "Cerca su Google...",
  newtabSearchButton: "Cerca",
  newtabFooter: "Il tuo compagno Pokémon vive anche in questa scheda",
  newtabDisabledMessage:
    "Scheda personalizzata disattivata — attivala nel popup di Pokechi.",
  newtabShowcaseTitle: "Clicca per vedere un altro Pokémon",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "Vedi nel Pokechidex",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ Attività!`,
    tab_event: (n) => `+${n} XP 📑 Scheda!`,
    youtube_song: (n) => `+${n} XP 🎵 Canzone!`,
    gmail_read: (n) => `+${n} XP ✉️ Mail letta!`,
    gmail_deleted: (n) => `+${n} XP 🗑️ Eliminata!`,
    page_clicks: (n) => `+${n} XP 🖱️ Clic!`,
    typing: (n) => `+${n} XP ⌨️ Digitazione!`,
    rare_candy: (n) => `+${n} XP 🍬 Caramella rara!`,
    master_ball: (n) => `+${n} XP ⚪ Master Ball!`,
    premier_ball: (n) => `+${n} XP 🔴 Premier Ball!`,
    hatch: (n) => `+${n} XP 🥚 Schiuso!`,
    evolution: () => `✨ Evoluzione!`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ Evoluzione!",
  xpMax: "XP MAX",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle:
    "Collezione di Pokémon scoperti, badge e oggetti nella tua Borsa.",
  undiscoveredName: "???",
  counterDiscovered: "Scoperti",
  counterShiny: "Shiny",
  counterBadges: "Badge",
  counterTotalXP: "XP Totale",
  candyCounterNoneYet: (itemName) =>
    `Non hai ancora ${itemName} - far schiudere una Poké Ball ha una piccola probabilità di darne una`,
  candyCounterNotUsableNow: (itemName) =>
    `Il tuo pokémon attuale non può usare una ${itemName} in questo momento`,

  bagLabel: "Borsa",
  bagTabItems: "Oggetti",
  bagTabBadges: "Badge",
  bagTabChallenges: "Sfide",
  challengesEmpty: "Nessuna sfida completata ancora — appariranno qui una volta ottenute.",
  itemUseButton: "Usa",
  badgeStatusObtained: "Ottenuto",
  badgeStatusLocked: "Bloccato",
  badgeGenerationLabel: (generation) => `Gen ${generation}`,

  requirementSpeciesDiscovered: "Specie scoperte",
  requirementShinyDiscovered: "Shiny scoperti",
  requirementFossilsDiscovered: "Fossili scoperti",
  requirementSubLegendariesDiscovered: "Sub-leggendari scoperti",
  requirementLegendariesDiscovered: "Leggendari scoperti",
  requirementMythicalsDiscovered: "Mitici scoperti",
  requirementRareCandiesUsed: "Caramelle rare usate",

  searchPlaceholder: "Cerca per nome o numero",
  searchAriaLabel: "Cerca nel Pokechidex",
  filtersAriaLabel: "Filtri del Pokedex",
  filterAll: "Tutti",
  typeFilterLabel: "Tipo",
  typeFilterAriaLabel: "Filtra per tipo",
  typeFilterClear: "Cancella",
  filterDiscoveredOnly: "Solo scoperti",
  filterShinyUnlocked: "Shiny sbloccato",
  emptyState: "Niente corrisponde a questa ricerca.",
  gridAriaLabel: "Griglia del Pokechidex",

  cardShowLabel: (name) => `Mostra ${name}`,
  cardShowLabelActive: (name) => `Mostra ${name}, attualmente attivo`,
  cardUndiscoveredLabel: "Pokémon non scoperto",
  toggleShinyLabel: (name) => `Alterna sprite shiny di ${name}`,
  toggleShinyTitle: "Alterna sprite shiny",
  playCryLabel: (name) => `Riproduci il verso di ${name}`,
  playCryTitle: "Riproduci verso",
  showInfoLabel: (name) => `Mostra info di ${name}`,
  showMovesLabel: (name) => `Mostra mosse di ${name}`,
  infoTitle: "Info",
  movesTitle: "Mosse",
  activeBadge: "Attivo",
};
