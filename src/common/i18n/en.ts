import { Strings } from "./strings";

export const en: Strings = {
  itemNames: {
    "rare-candy": "Rare Candy",
    "master-ball": "Master Ball",
    "premier-ball": "Premier Ball",
  },
  itemDescriptions: {
    "rare-candy":
      "Instantly evolves your current pokemon, as long as it is not already fully evolved.",
    "master-ball":
      "Reveals a random sub-legendary, legendary or mythical Pokémon from any generation.",
    "premier-ball":
      "Reveals a random Pokémon as shiny, from any generation or rarity.",
  },
  typeAbbreviations: {
    normal: "NOR",
    fire: "FIR",
    water: "WAT",
    electric: "ELE",
    grass: "GRA",
    ice: "ICE",
    fighting: "FIG",
    poison: "POI",
    ground: "GRD",
    flying: "FLY",
    psychic: "PSY",
    bug: "BUG",
    rock: "ROC",
    ghost: "GHO",
    dragon: "DRA",
    dark: "DAK",
    steel: "STE",
  },

  badgeEarned: (badgeName) => `🏅 ${badgeName} earned!`,

  catchNewPokemonConfirm:
    "Catch a new Pokemon? The one currently out will be tucked away - its progress is saved and you can bring it back from the Pokechidex.",
  catchNewPokemonButton: "Catch a New Pokemon",

  useItemButton: (itemName) => `Use ${itemName}`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 Your ${itemName} revealed ${pokemonName}!`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ Your ${itemName} revealed a shiny ${pokemonName}!`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ Your ${itemName} revealed a shiny ${pokemonName}!`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "XP Progress",
  popupCaught: "Caught",
  popupCandies: "Candies",
  popupPetVisible: "Floating pet",
  popupCustomNewTab: "Custom new tab",
  popupSoundEnabled: "Sounds and cries",
  popupScale: "Size",
  popupLevelEgg: "Egg",
  languageLabel: "Language",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "New Tab",
  newtabSearchPlaceholder: "Search Google...",
  newtabSearchButton: "Search",
  newtabFooter: "Your Pokémon companion also lives on this tab",
  newtabDisabledMessage:
    "Custom tab disabled — enable it in the Pokechi popup.",
  newtabShowcaseTitle: "Click to see another Pokémon",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "View in Pokechidex",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ Active minute!`,
    tab_event: (n) => `+${n} XP 📑 Tab!`,
    youtube_song: (n) => `+${n} XP 🎵 Song!`,
    gmail_read: (n) => `+${n} XP ✉️ Email read!`,
    gmail_deleted: (n) => `+${n} XP 🗑️ Email deleted!`,
    page_clicks: (n) => `+${n} XP 🖱️ Clicks!`,
    typing: (n) => `+${n} XP ⌨️ Typing!`,
    rare_candy: (n) => `+${n} XP 🍬 Rare Candy!`,
    master_ball: (n) => `+${n} XP ⚪ Master Ball!`,
    premier_ball: (n) => `+${n} XP 🔴 Premier Ball!`,
    hatch: (n) => `+${n} XP 🥚 Hatched!`,
    evolution: () => `✨ Evolution!`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ Evolution!",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle:
    "Collection of discovered Pokémon, badges and items in your bag.",
  undiscoveredName: "???",
  counterDiscovered: "Discovered",
  counterShiny: "Shiny",
  counterBadges: "Badges",
  counterTotalXP: "Total XP",
  candyCounterNoneYet: (itemName) =>
    `No ${itemName} yet - hatching a Pokeball has a small chance to drop one`,
  candyCounterNotUsableNow: (itemName) =>
    `Your current pokemon cannot use a ${itemName} right now`,

  bagLabel: "Bag",
  bagTabItems: "Items",
  bagTabBadges: "Badges",
  itemUseButton: "Use",
  badgeStatusObtained: "Obtained",
  badgeStatusLocked: "Locked",
  badgeGenerationLabel: (generation) => `Gen ${generation}`,

  requirementSpeciesDiscovered: "Species discovered",
  requirementShinyDiscovered: "Shiny discovered",
  requirementFossilsDiscovered: "Fossils discovered",
  requirementSubLegendariesDiscovered: "Sub-legendaries discovered",
  requirementLegendariesDiscovered: "Legendaries discovered",
  requirementMythicalsDiscovered: "Mythicals discovered",
  requirementRareCandiesUsed: "Rare Candies used",

  searchPlaceholder: "Search by name or number",
  searchAriaLabel: "Search the Pokechidex",
  filtersAriaLabel: "Pokedex filters",
  filterAll: "All",
  typeFilterLabel: "Type",
  typeFilterAriaLabel: "Filter by type",
  typeFilterClear: "Clear",
  filterDiscoveredOnly: "Discovered only",
  filterShinyUnlocked: "Shiny unlocked",
  emptyState: "Nothing matches that search.",
  gridAriaLabel: "Pokechidex grid",

  cardShowLabel: (name) => `Show ${name}`,
  cardShowLabelActive: (name) => `Show ${name}, currently active`,
  cardUndiscoveredLabel: "Undiscovered pokemon",
  toggleShinyLabel: (name) => `Toggle shiny sprite for ${name}`,
  toggleShinyTitle: "Toggle shiny sprite",
  playCryLabel: (name) => `Play ${name}'s cry`,
  playCryTitle: "Play cry",
  showInfoLabel: (name) => `Show info for ${name}`,
  showMovesLabel: (name) => `Show moves for ${name}`,
  infoTitle: "Info",
  movesTitle: "Moves",
  activeBadge: "Active",
};
