import { Strings } from "./strings";

// Item names are the official Spanish localization used in the games
// themselves (verified via PokeAPI's item.names, not guessed) - Master
// Ball stays "Master Ball" in Spanish too, and Premier Ball is actually
// "Honor Ball".
export const es: Strings = {
  itemNames: {
    "rare-candy": "Caramelo Raro",
    "master-ball": "Master Ball",
    "premier-ball": "Honor Ball",
  },
  itemDescriptions: {
    "rare-candy":
      "Evoluciona al instante a tu pokémon actual, siempre que no esté ya completamente evolucionado.",
    "master-ball":
      "Revela un Pokémon sub-legendario, legendario o mítico al azar de cualquier generación.",
    "premier-ball":
      "Revela un Pokémon al azar como shiny, de cualquier generación o rareza.",
  },
  // The official in-game Spanish abbreviations, matching the full type
  // names verified via PokeAPI's type.names (Fuego, Agua, Eléctrico,
  // Planta, Lucha, Volador, Psíquico, Bicho, Fantasma, Siniestro, Acero...).
  typeAbbreviations: {
    normal: "NOR",
    fire: "FUE",
    water: "AGU",
    electric: "ELE",
    grass: "PLA",
    ice: "HIE",
    fighting: "LUC",
    poison: "VEN",
    ground: "TIE",
    flying: "VOL",
    psychic: "PSI",
    bug: "BIC",
    rock: "ROC",
    ghost: "FAN",
    dragon: "DRA",
    dark: "SIN",
    steel: "ACE",
  },

  badgeEarned: (badgeName) => `🏅 ¡Conseguiste la ${badgeName}!`,

  catchNewPokemonConfirm:
    "¿Atrapar un nuevo Pokémon? El que tienes afuera se guardará - su progreso se conserva y puedes volver a sacarlo desde el Pokechidex.",
  catchNewPokemonButton: "Atrapar un nuevo Pokémon",

  useItemButton: (itemName) => `Usar ${itemName}`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 ¡Tu ${itemName} reveló a ${pokemonName}!`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ ¡Tu ${itemName} reveló a un ${pokemonName} shiny!`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ ¡Tu ${itemName} reveló a un ${pokemonName} shiny!`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "Progreso de XP",
  popupCaught: "Atrapados",
  popupCandies: "Caramelos",
  popupPetVisible: "Mascota flotante",
  popupCustomNewTab: "Pestaña nueva personalizada",
  popupSoundEnabled: "Sonidos y gritos",
  popupScale: "Tamaño",
  popupLevelEgg: "Huevo",
  languageLabel: "Idioma",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "Nueva pestaña",
  newtabSearchPlaceholder: "Buscar en Google...",
  newtabSearchButton: "Buscar",
  newtabFooter: "Tu compañero Pokémon también vive en esta pestaña",
  newtabDisabledMessage:
    "Pestaña personalizada desactivada — actívala en el popup de Pokechi.",
  newtabShowcaseTitle: "Clic para ver otro Pokémon",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "Ver en Pokechidex",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ Actividad!`,
    tab_event: (n) => `+${n} XP 📑 Pestaña!`,
    youtube_song: (n) => `+${n} XP 🎵 Canción!`,
    gmail_read: (n) => `+${n} XP ✉️ Correo leído!`,
    gmail_deleted: (n) => `+${n} XP 🗑️ Eliminado!`,
    page_clicks: (n) => `+${n} XP 🖱️ Clics!`,
    typing: (n) => `+${n} XP ⌨️ Escritura!`,
    rare_candy: (n) => `+${n} XP 🍬 ¡Caramelo Raro!`,
    master_ball: (n) => `+${n} XP ⚪ ¡Master Ball!`,
    premier_ball: (n) => `+${n} XP 🔴 ¡Honor Ball!`,
    hatch: (n) => `+${n} XP 🥚 ¡Eclosionó!`,
    evolution: () => `✨ ¡Evolución!`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ ¡Evolución!",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle:
    "Colección de Pokémon descubiertos, medallas y objetos de tu mochila.",
  undiscoveredName: "???",
  counterDiscovered: "Descubiertos",
  counterShiny: "Shiny",
  counterBadges: "Medallas",
  counterTotalXP: "XP Total",
  candyCounterNoneYet: (itemName) =>
    `Todavía no tienes ${itemName} - eclosionar una Poké Ball tiene una pequeña probabilidad de darte uno`,
  candyCounterNotUsableNow: (itemName) =>
    `Tu pokémon actual no puede usar un ${itemName} ahora mismo`,

  bagLabel: "Mochila",
  bagTabItems: "Objetos",
  bagTabBadges: "Medallas",
  itemUseButton: "Usar",
  badgeStatusObtained: "Obtenida",
  badgeStatusLocked: "Bloqueada",
  badgeGenerationLabel: (generation) => `Gen ${generation}`,

  requirementSpeciesDiscovered: "Especies descubiertas",
  requirementShinyDiscovered: "Shiny descubiertos",
  requirementFossilsDiscovered: "Fósiles descubiertos",
  requirementSubLegendariesDiscovered: "Sublegendarios descubiertos",
  requirementLegendariesDiscovered: "Legendarios descubiertos",
  requirementMythicalsDiscovered: "Míticos descubiertos",
  requirementRareCandiesUsed: "Caramelos Raros usados",

  searchPlaceholder: "Buscar por nombre o número",
  searchAriaLabel: "Buscar en el Pokechidex",
  filtersAriaLabel: "Filtros del Pokedex",
  filterAll: "Todos",
  typeFilterLabel: "Tipo",
  typeFilterAriaLabel: "Filtrar por tipo",
  typeFilterClear: "Limpiar",
  filterDiscoveredOnly: "Solo descubiertos",
  filterShinyUnlocked: "Shiny desbloqueado",
  emptyState: "Nada coincide con esa búsqueda.",
  gridAriaLabel: "Cuadrícula del Pokechidex",

  cardShowLabel: (name) => `Mostrar a ${name}`,
  cardShowLabelActive: (name) => `Mostrar a ${name}, actualmente activo`,
  cardUndiscoveredLabel: "Pokémon sin descubrir",
  toggleShinyLabel: (name) => `Alternar sprite shiny de ${name}`,
  toggleShinyTitle: "Alternar sprite shiny",
  playCryLabel: (name) => `Reproducir el grito de ${name}`,
  playCryTitle: "Reproducir grito",
  showInfoLabel: (name) => `Mostrar información de ${name}`,
  showMovesLabel: (name) => `Mostrar movimientos de ${name}`,
  infoTitle: "Info",
  movesTitle: "Movimientos",
  activeBadge: "Activo",
};
