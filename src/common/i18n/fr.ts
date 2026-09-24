import { Strings } from "./strings";

// Item and type names are the official French localization used in the
// games themselves (verified via PokeAPI's item.names/type.names) - Master
// Ball stays "Master Ball", Rare Candy is "Super Bonbon", and Premier Ball
// is actually "Honor Ball" here too, same as in Spanish.
export const fr: Strings = {
  itemNames: {
    "rare-candy": "Super Bonbon",
    "master-ball": "Master Ball",
    "premier-ball": "Honor Ball",
  },
  itemDescriptions: {
    "rare-candy":
      "Fait évoluer instantanément ton pokémon actuel, tant qu'il n'est pas déjà totalement évolué.",
    "master-ball":
      "Révèle un Pokémon sous-légendaire, légendaire ou mythique aléatoire, toutes générations confondues.",
    "premier-ball":
      "Révèle un Pokémon aléatoire en shiny, toutes générations et raretés confondues.",
  },
  // The official in-game French abbreviations, matching the full type names
  // verified via PokeAPI's type.names (Feu, Eau, Électrik, Plante, Combat,
  // Insecte, Roche, Spectre, Ténèbres, Acier...).
  typeAbbreviations: {
    normal: "NOR",
    fire: "FEU",
    water: "EAU",
    electric: "ELE",
    grass: "PLA",
    ice: "GLA",
    fighting: "COM",
    poison: "POI",
    ground: "SOL",
    flying: "VOL",
    psychic: "PSY",
    bug: "INS",
    rock: "ROC",
    ghost: "SPE",
    dragon: "DRA",
    dark: "TEN",
    steel: "ACI",
  },

  badgeEarned: (badgeName) => `🏅 Tu as obtenu le badge ${badgeName} !`,

  catchNewPokemonConfirm:
    "Capturer un nouveau Pokémon ? Celui que tu as actuellement sera mis de côté - sa progression est sauvegardée et tu peux le ressortir depuis le Pokechidex.",
  catchNewPokemonButton: "Capturer un Nouveau Pokémon",

  useItemButton: (itemName) => `Utiliser ${itemName}`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 Ta ${itemName} a révélé ${pokemonName} !`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ Ta ${itemName} a révélé un ${pokemonName} shiny !`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ Ta ${itemName} a révélé un ${pokemonName} shiny !`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "Progression XP",
  popupCaught: "Capturés",
  popupCandies: "Bonbons",
  popupPetVisible: "Mascotte flottante",
  popupCustomNewTab: "Nouvel onglet personnalisé",
  popupSoundEnabled: "Sons et cris",
  popupScale: "Taille",
  popupLevelEgg: "Œuf",
  languageLabel: "Langue",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "Nouvel onglet",
  newtabSearchPlaceholder: "Rechercher sur Google...",
  newtabSearchButton: "Rechercher",
  newtabFooter: "Ton compagnon Pokémon vit aussi sur cet onglet",
  newtabDisabledMessage:
    "Onglet personnalisé désactivé — active-le dans le popup de Pokechi.",
  newtabShowcaseTitle: "Clique pour voir un autre Pokémon",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "Voir dans le Pokechidex",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ Activité !`,
    tab_event: (n) => `+${n} XP 📑 Onglet !`,
    youtube_song: (n) => `+${n} XP 🎵 Chanson !`,
    gmail_read: (n) => `+${n} XP ✉️ Mail lu !`,
    gmail_deleted: (n) => `+${n} XP 🗑️ Supprimé !`,
    page_clicks: (n) => `+${n} XP 🖱️ Clics !`,
    typing: (n) => `+${n} XP ⌨️ Saisie !`,
    rare_candy: (n) => `+${n} XP 🍬 Super Bonbon !`,
    master_ball: (n) => `+${n} XP ⚪ Master Ball !`,
    premier_ball: (n) => `+${n} XP 🔴 Honor Ball !`,
    hatch: (n) => `+${n} XP 🥚 Éclos !`,
    evolution: () => `✨ Évolution !`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ Évolution !",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle:
    "Collection de Pokémon découverts, de badges et d'objets dans ton Sac.",
  undiscoveredName: "???",
  counterDiscovered: "Découverts",
  counterShiny: "Shiny",
  counterBadges: "Badges",
  counterTotalXP: "XP Total",
  candyCounterNoneYet: (itemName) =>
    `Pas encore de ${itemName} - faire éclore une Poké Ball a une petite chance d'en donner un`,
  candyCounterNotUsableNow: (itemName) =>
    `Ton pokémon actuel ne peut pas utiliser de ${itemName} pour le moment`,

  bagLabel: "Sac",
  bagTabItems: "Objets",
  bagTabBadges: "Badges",
  itemUseButton: "Utiliser",
  badgeStatusObtained: "Obtenu",
  badgeStatusLocked: "Verrouillé",
  badgeGenerationLabel: (generation) => `Gén ${generation}`,

  requirementSpeciesDiscovered: "Espèces découvertes",
  requirementShinyDiscovered: "Shiny découverts",
  requirementFossilsDiscovered: "Fossiles découverts",
  requirementSubLegendariesDiscovered: "Sous-légendaires découverts",
  requirementLegendariesDiscovered: "Légendaires découverts",
  requirementMythicalsDiscovered: "Mythiques découverts",
  requirementRareCandiesUsed: "Super Bonbons utilisés",

  searchPlaceholder: "Rechercher par nom ou numéro",
  searchAriaLabel: "Rechercher dans le Pokechidex",
  filtersAriaLabel: "Filtres du Pokédex",
  filterAll: "Tous",
  typeFilterLabel: "Type",
  typeFilterAriaLabel: "Filtrer par type",
  typeFilterClear: "Effacer",
  filterDiscoveredOnly: "Découverts uniquement",
  filterShinyUnlocked: "Shiny débloqué",
  emptyState: "Rien ne correspond à cette recherche.",
  gridAriaLabel: "Grille du Pokechidex",

  cardShowLabel: (name) => `Afficher ${name}`,
  cardShowLabelActive: (name) => `Afficher ${name}, actuellement actif`,
  cardUndiscoveredLabel: "Pokémon non découvert",
  toggleShinyLabel: (name) => `Basculer le sprite shiny de ${name}`,
  toggleShinyTitle: "Basculer le sprite shiny",
  playCryLabel: (name) => `Jouer le cri de ${name}`,
  playCryTitle: "Jouer le cri",
  showInfoLabel: (name) => `Afficher les infos de ${name}`,
  showMovesLabel: (name) => `Afficher les capacités de ${name}`,
  infoTitle: "Infos",
  movesTitle: "Capacités",
  activeBadge: "Actif",
};
