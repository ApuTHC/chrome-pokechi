// UI-facing strings for every surface of the extension: the popup, the
// new tab, the Pokedex page, the floating pet's XP badges and the
// confirmation/reveal sentences of item usage.
//
// Every language dictionary (i18n/*.ts) has to fill this in completely -
// adding a key here without adding it to every dictionary is a type error,
// which is what keeps a language from silently falling back to English one
// string at a time as this grows.
//
// Keys that no surface rendered anymore (the old VS Code notification
// sentences: hatchMessage, explorerMode*, pokedexSnapshot*, ...) were
// removed rather than left to rot; recycle a surviving key where a new
// message fits instead of inventing a near-duplicate.
export interface Strings {
  // Item id (src/common/items.ts) -> its display name in this language.
  // Translated here rather than in that registry, which stays the single
  // English/canonical source for ids and sprite paths - what to call an
  // item in a sentence is a UI-facing concern like everything else in this
  // dictionary. A new item only needs an entry here, same as it only needs
  // one in ITEMS - nothing else in this file has to change shape for it.
  itemNames: { [itemId: string]: string }
  // Same idea as itemNames, for the sentence shown as an item card's
  // description / a usable candy counter's tooltip.
  itemDescriptions: { [itemId: string]: string }
  // Elemental type -> its 3-letter badge abbreviation in this language
  // (PokemonElementType, src/common/types.ts). Colors stay the same
  // regardless of language - see getLocalizedTypeBadges in type-badges.ts.
  typeAbbreviations: { [type: string]: string }

  badgeEarned: (badgeName: string) => string
  challengeEarned: (challengeName: string) => string

  catchNewPokemonConfirm: string
  catchNewPokemonButton: string

  useItemButton: (itemName: string) => string

  masterBallRevealedMessage: (itemName: string, pokemonName: string) => string
  masterBallRevealedMessageShiny: (itemName: string, pokemonName: string) => string
  premierBallRevealedMessage: (itemName: string, pokemonName: string) => string

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: string
  popupCaught: string
  popupCandies: string
  popupPowerUps: string
  popupPowerUpsEmpty: string
  popupPetVisible: string
  popupCustomNewTab: string
  popupSoundEnabled: string
  popupScale: string
  // Level tag / type badge shown while the pokemon is still an egg.
  popupLevelEgg: string
  languageLabel: string

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: string
  newtabSearchPlaceholder: string
  newtabSearchButton: string
  newtabFooter: string
  newtabDisabledMessage: string
  newtabShowcaseTitle: string

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: string
  // XP badge text per XP reason (src/state.ts XPReason). Reasons without
  // an entry here fall back to a plain "+N XP" in the component. The
  // 'evolution' entry ignores the amount: it celebrates the evolution.
  xpReasonLabels: { [reason: string]: (amount: number) => string }
  evolvedNotification: string
  xpMax: string

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle: string
  // Placeholder name on an undiscovered card.
  undiscoveredName: string
  counterDiscovered: string
  counterShiny: string
  counterBadges: string
  counterTotalXP: string
  candyCounterNoneYet: (itemName: string) => string
  candyCounterNotUsableNow: (itemName: string) => string

  bagLabel: string
  bagTabItems: string
  bagTabBadges: string
  bagTabChallenges: string
  challengesEmpty: string
  itemUseButton: string
  badgeStatusObtained: string
  badgeStatusLocked: string
  badgeGenerationLabel: (generation: number) => string

  requirementSpeciesDiscovered: string
  requirementShinyDiscovered: string
  requirementFossilsDiscovered: string
  requirementSubLegendariesDiscovered: string
  requirementLegendariesDiscovered: string
  requirementMythicalsDiscovered: string
  requirementRareCandiesUsed: string

  searchPlaceholder: string
  searchAriaLabel: string
  filtersAriaLabel: string
  filterAll: string
  typeFilterLabel: string
  typeFilterAriaLabel: string
  typeFilterClear: string
  filterDiscoveredOnly: string
  filterShinyUnlocked: string
  emptyState: string
  gridAriaLabel: string

  cardShowLabel: (name: string) => string
  cardShowLabelActive: (name: string) => string
  cardUndiscoveredLabel: string
  toggleShinyLabel: (name: string) => string
  toggleShinyTitle: string
  playCryLabel: (name: string) => string
  playCryTitle: string
  showInfoLabel: (name: string) => string
  showMovesLabel: (name: string) => string
  infoTitle: string
  movesTitle: string
  activeBadge: string
}
