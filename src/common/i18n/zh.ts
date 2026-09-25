import { Strings } from "./strings";

// Item and type names are the official Simplified Chinese localization used
// in the games themselves (verified via PokeAPI's item.names/type.names).
// "Shiny" is rendered as 闪光 throughout, the standard term in Chinese
// Pokémon communities (the strict in-game term is 异色, "different color",
// but 闪光 is what players actually say and reads naturally as an
// adjective before a name).
export const zh: Strings = {
  itemNames: {
    "rare-candy": "神奇糖果",
    "master-ball": "大师球",
    "premier-ball": "纪念球",
  },
  itemDescriptions: {
    "rare-candy": "让你当前的宝可梦立即进化，前提是它还没有完全进化。",
    "master-ball": "揭示任意世代的随机准传说、传说或幻之宝可梦。",
    "premier-ball": "揭示任意世代或稀有度的随机闪光宝可梦。",
  },
  // Chinese type names are already short enough on their own (mostly one or
  // two characters) that a further abbreviation would not save any space,
  // unlike English/Spanish/French/Italian's longer names - so the badge
  // just uses the full, official in-game name for each type (属性).
  typeAbbreviations: {
    normal: "一般",
    fire: "火",
    water: "水",
    electric: "电",
    grass: "草",
    ice: "冰",
    fighting: "格斗",
    poison: "毒",
    ground: "地面",
    flying: "飞行",
    psychic: "超能力",
    bug: "虫",
    rock: "岩石",
    ghost: "幽灵",
    dragon: "龙",
    dark: "恶",
    steel: "钢",
  },

  badgeEarned: (badgeName) => `🏅 获得了${badgeName}！`,
  challengeEarned: (challengeName) => `🏆 挑战完成：${challengeName}！+1 纪念球`,
  challengeNames: {
    "fire-master": "火大师",
    "water-master": "水大师",
    "leaf-master": "草大师",
    "classic-shiny": "真正的经典",
    "fighters": "格斗家",
    "headaches": "头痛",
    "city-master": "城市主宰",
    "catch-em-all": "全部抓住！",
    "brocks-heartbreak": "小刚的心碎",
    "rocket-motto": "为了保护世界免遭蹂躏",
    "joy-legacy": "乔伊小姐的传承",
    "electric-storm": "电气风暴",
    "dragon-sanctuary": "龙之圣域",
    "night-terror": "黑夜恐惧",
    "outcast-club": "被嫌弃者俱乐部",
    "forest-plague": "森林虫灾",
  },

  catchNewPokemonConfirm:
    "要捕捉一只新的宝可梦吗？当前放出的宝可梦会被收起来 - 它的进度会被保存，你可以随时从Pokechidex中把它放出来。",
  catchNewPokemonButton: "捕捉新宝可梦",

  useItemButton: (itemName) => `使用${itemName}`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 你的${itemName}揭示了${pokemonName}！`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ 你的${itemName}揭示了闪光${pokemonName}！`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ 你的${itemName}揭示了闪光${pokemonName}！`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "经验值进度",
  popupCaught: "已捕捉",
  popupCandies: "糖果",
  popupPowerUps: "强化",
  popupPowerUpsEmpty: "暂无强化",
  popupPetVisible: "悬浮伙伴",
  popupCustomNewTab: "自定义新标签页",
  popupSoundEnabled: "声音与叫声",
  popupScale: "大小",
  popupLevelEgg: "蛋",
  languageLabel: "语言",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "新标签页",
  newtabSearchPlaceholder: "在 Google 上搜索...",
  newtabSearchButton: "搜索",
  newtabFooter: "你的宝可梦伙伴也住在这个标签页里",
  newtabDisabledMessage: "自定义标签页已关闭 — 在 Pokechi 弹窗中开启。",
  newtabShowcaseTitle: "点击查看另一只宝可梦",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "在 Pokechidex 中查看",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ 活跃！`,
    tab_event: (n) => `+${n} XP 📑 标签页！`,
    youtube_song: (n) => `+${n} XP 🎵 歌曲！`,
    gmail_read: (n) => `+${n} XP ✉️ 已读邮件！`,
    gmail_deleted: (n) => `+${n} XP 🗑️ 已删除！`,
    page_clicks: (n) => `+${n} XP 🖱️ 点击！`,
    typing: (n) => `+${n} XP ⌨️ 打字！`,
    rare_candy: (n) => `+${n} XP 🍬 神奇糖果！`,
    master_ball: (n) => `+${n} XP ⚪ 大师球！`,
    premier_ball: (n) => `+${n} XP 🔴 纪念球！`,
    hatch: (n) => `+${n} XP 🥚 孵化！`,
    evolution: () => `✨ 进化！`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ 进化！",
  xpMax: "XP 最大",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle: "已发现的宝可梦、徽章与背包道具收藏。",
  undiscoveredName: "???",
  counterDiscovered: "已发现",
  counterShiny: "闪光",
  counterBadges: "徽章",
  counterTotalXP: "总经验值",
  candyCounterNoneYet: (itemName) =>
    `还没有${itemName} - 孵化精灵球有小概率获得一个`,
  candyCounterNotUsableNow: (itemName) =>
    `你当前的宝可梦现在无法使用${itemName}`,

  bagLabel: "背包",
  bagTabItems: "道具",
  bagTabBadges: "徽章",
  bagTabChallenges: "挑战",
  challengesEmpty: "还没有完成的挑战——获得后会显示在这里。",
  challengeObjectives: {
    "fire-master": "完成4条火系初始宝可梦进化线（Charizard、Typhlosion、Blaziken、Infernape）。",
    "water-master": "完成4条水系初始宝可梦进化线（Blastoise、Feraligatr、Swampert、Empoleon）。",
    "leaf-master": "完成4条草系初始宝可梦进化线（Venusaur、Meganium、Sceptile、Torterra）。",
    "classic-shiny": "获得一只闪光Gyarados。",
    "fighters": "获得Hitmonlee和Hitmonchan。",
    "headaches": "获得Mewtwo。",
    "city-master": "完成任意一个世代的全部宝可梦（仅在首次完成世代时授予）。",
    "catch-em-all": "完成整个Pokechidex（所有世代的全部宝可梦）。",
    "brocks-heartbreak": "获得Onix、Steelix、Geodude和Sudowoodo。",
    "rocket-motto": "获得Meowth、Arbok、Weezing和Seviper。",
    "joy-legacy": "获得Togepi和Chansey。",
    "electric-storm": "获得Pikachu、Electabuzz和Ampharos。",
    "dragon-sanctuary": "获得Dragonite、Salamence和Garchomp。",
    "night-terror": "获得Gengar、Misdreavus和Sableye。",
    "outcast-club": "获得Rattata、Sentret、Zigzagoon和Bidoof。",
    "forest-plague": "获得Butterfree、Scizor和Heracross。",
  },
  challengePowerUps: {
    "fire-master": "上场宝可梦为火系时XP x2",
    "water-master": "上场宝可梦为水系时XP x2",
    "leaf-master": "上场宝可梦为草系时XP x2",
    "classic-shiny": "上场宝可梦为闪光时XP x2",
    "fighters": "上场宝可梦为格斗系时XP x2",
    "headaches": "上场宝可梦为超能力系时XP x2",
    "city-master": "任何宝可梦任何状态下XP永远x2",
    "catch-em-all": "今后的发现必定为闪光",
    "brocks-heartbreak": "上场宝可梦为岩石系时XP x2",
    "rocket-motto": "上场宝可梦为毒系时XP x2",
    "joy-legacy": "仅在宝可梦处于精灵球状态时XP x2",
    "electric-storm": "上场宝可梦为电系时XP x2",
    "dragon-sanctuary": "上场宝可梦为龙系时XP x2",
    "night-terror": "上场宝可梦为幽灵系时XP x2",
    "outcast-club": "上场宝可梦为一般系时XP x2",
    "forest-plague": "上场宝可梦为虫系时XP x2",
  },
  itemUseButton: "使用",
  badgeStatusObtained: "已获得",
  badgeStatusLocked: "未解锁",
  badgeGenerationLabel: (generation) => `第${generation}世代`,

  requirementSpeciesDiscovered: "已发现的物种",
  requirementShinyDiscovered: "已发现的闪光",
  requirementFossilsDiscovered: "已发现的化石",
  requirementSubLegendariesDiscovered: "已发现的准传说",
  requirementLegendariesDiscovered: "已发现的传说",
  requirementMythicalsDiscovered: "已发现的幻之",
  requirementRareCandiesUsed: "已使用的神奇糖果",

  searchPlaceholder: "按名称或编号搜索",
  searchAriaLabel: "搜索 Pokechidex",
  filtersAriaLabel: "Pokedex 筛选",
  filterAll: "全部",
  typeFilterLabel: "属性",
  typeFilterAriaLabel: "按属性筛选",
  typeFilterClear: "清除",
  filterDiscoveredOnly: "仅显示已发现",
  filterShinyUnlocked: "闪光已解锁",
  emptyState: "没有符合搜索条件的结果。",
  gridAriaLabel: "Pokechidex 网格",

  cardShowLabel: (name) => `显示${name}`,
  cardShowLabelActive: (name) => `显示${name}，当前已放出`,
  cardUndiscoveredLabel: "未发现的宝可梦",
  toggleShinyLabel: (name) => `切换${name}的闪光形态`,
  toggleShinyTitle: "切换闪光形态",
  playCryLabel: (name) => `播放${name}的叫声`,
  playCryTitle: "播放叫声",
  showInfoLabel: (name) => `显示${name}的信息`,
  showMovesLabel: (name) => `显示${name}的招式`,
  infoTitle: "信息",
  movesTitle: "招式",
  activeBadge: "已放出",
};
