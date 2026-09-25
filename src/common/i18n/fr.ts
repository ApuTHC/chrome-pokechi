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
  challengeEarned: (challengeName) => `🏆 Défi accompli : ${challengeName} ! +1 Honor Ball`,
  challengeNames: {
    "fire-master": "Maître Feu",
    "water-master": "Maître Eau",
    "leaf-master": "Maître Plante",
    "classic-shiny": "Un vrai classique",
    "fighters": "Combattants",
    "headaches": "Maux de tête",
    "city-master": "Maître de la Ville",
    "catch-em-all": "Attrapez-les tous !",
    "brocks-heartbreak": "Le chagrin de Brock",
    "rocket-motto": "Pour protéger le monde de la dévastation",
    "joy-legacy": "L'héritage de l'Infirmière Joëlle",
    "electric-storm": "Orage électrique",
    "dragon-sanctuary": "Sanctuaire du Dragon",
    "night-terror": "Terreur nocturne",
    "outcast-club": "Le club des rejetés",
    "forest-plague": "Fléau de la forêt",
  },

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
  popupPowerUps: "Bonus",
  popupPowerUpsEmpty: "Aucun bonus pour l'instant",
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
  xpMax: "XP MAX",

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
  bagTabChallenges: "Défis",
  challengesEmpty: "Aucun défi accompli pour l'instant — ils apparaîtront ici une fois gagnés.",
  challengeObjectives: {
    "fire-master": "Termine les 4 lignées de starters Feu (Charizard, Typhlosion, Blaziken et Infernape).",
    "water-master": "Termine les 4 lignées de starters Eau (Blastoise, Feraligatr, Swampert et Empoleon).",
    "leaf-master": "Termine les 4 lignées de starters Plante (Venusaur, Meganium, Sceptile et Torterra).",
    "classic-shiny": "Obtiens un Gyarados shiny.",
    "fighters": "Obtiens Hitmonlee et Hitmonchan.",
    "headaches": "Obtiens Mewtwo.",
    "city-master": "Termine tous les Pokémon de l'une des générations (accordé uniquement la première fois que tu termines une génération).",
    "catch-em-all": "Termine toute la Pokechidex (tous les Pokémon de toutes les générations).",
    "brocks-heartbreak": "Obtiens Onix, Steelix, Geodude et Sudowoodo.",
    "rocket-motto": "Obtiens Meowth, Arbok, Weezing et Seviper.",
    "joy-legacy": "Obtiens Togepi et Chansey.",
    "electric-storm": "Obtiens Pikachu, Electabuzz et Ampharos.",
    "dragon-sanctuary": "Obtiens Dragonite, Salamence et Garchomp.",
    "night-terror": "Obtiens Gengar, Misdreavus et Sableye.",
    "outcast-club": "Obtiens Rattata, Sentret, Zigzagoon et Bidoof.",
    "forest-plague": "Obtiens Butterfree, Scizor et Heracross.",
  },
  challengePowerUps: {
    "fire-master": "XP x2 si le Pokémon actif est de type Feu",
    "water-master": "XP x2 si le Pokémon actif est de type Eau",
    "leaf-master": "XP x2 si le Pokémon actif est de type Plante",
    "classic-shiny": "XP x2 si le Pokémon actif est shiny",
    "fighters": "XP x2 si le Pokémon actif est de type Combat",
    "headaches": "XP x2 si le Pokémon actif est de type Psy",
    "city-master": "XP x2 toujours, avec n'importe quel Pokémon dans n'importe quel état",
    "catch-em-all": "Les prochaines découvertes seront toujours shiny",
    "brocks-heartbreak": "XP x2 si le Pokémon actif est de type Roche",
    "rocket-motto": "XP x2 si le Pokémon actif est de type Poison",
    "joy-legacy": "XP x2 uniquement tant que le Pokémon est dans la Pokeball",
    "electric-storm": "XP x2 si le Pokémon actif est de type Électrik",
    "dragon-sanctuary": "XP x2 si le Pokémon actif est de type Dragon",
    "night-terror": "XP x2 si le Pokémon actif est de type Spectre",
    "outcast-club": "XP x2 si le Pokémon actif est de type Normal",
    "forest-plague": "XP x2 si le Pokémon actif est de type Insecte",
  },
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
