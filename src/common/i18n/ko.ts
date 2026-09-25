import { Strings } from "./strings";

// Item and type names are the official Korean localization used in the
// games themselves (verified via PokeAPI's item.names/type.names). "Shiny"
// is rendered as 이로치 throughout - the long-standing Korean community term
// (borrowed from the Japanese 色違い before an official localized term
// existed), the closest equivalent to how Spanish/French/Portuguese keep
// "shiny" itself as a loanword.
export const ko: Strings = {
  itemNames: {
    "rare-candy": "이상한사탕",
    "master-ball": "마스터볼",
    "premier-ball": "프리미어볼",
  },
  itemDescriptions: {
    "rare-candy":
      "지금 포켓몬이 아직 완전히 진화하지 않았다면 즉시 진화시켜요.",
    "master-ball":
      "모든 세대 중에서 무작위 준전설, 전설 또는 환상의 포켓몬을 보여줘요.",
    "premier-ball":
      "모든 세대와 희귀도 중에서 무작위 포켓몬을 이로치로 보여줘요.",
  },
  // Korean type names are already short enough on their own that a further
  // 3-letter abbreviation would not save any space, unlike English/Spanish/
  // French/Italian's longer names - so the badge just uses the full,
  // official in-game name for each type.
  typeAbbreviations: {
    normal: "노말",
    fire: "불꽃",
    water: "물",
    electric: "전기",
    grass: "풀",
    ice: "얼음",
    fighting: "격투",
    poison: "독",
    ground: "땅",
    flying: "비행",
    psychic: "에스퍼",
    bug: "벌레",
    rock: "바위",
    ghost: "고스트",
    dragon: "드래곤",
    dark: "악",
    steel: "강철",
  },

  badgeEarned: (badgeName) => `🏅 ${badgeName}을(를) 획득했어요!`,
  challengeEarned: (challengeName) => `🏆 도전 달성: ${challengeName}! 프리미어볼 +1`,

  catchNewPokemonConfirm:
    "새로운 포켓몬을 잡을까요? 지금 밖에 있는 포켓몬은 안전하게 보관돼요 - 진행 상황이 저장되며 Pokechidex에서 다시 꺼낼 수 있어요.",
  catchNewPokemonButton: "새로운 포켓몬 잡기",

  useItemButton: (itemName) => `${itemName} 사용`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 ${itemName}이(가) ${pokemonName}을(를) 보여줬어요!`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ ${itemName}이(가) 이로치 ${pokemonName}을(를) 보여줬어요!`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ ${itemName}이(가) 이로치 ${pokemonName}을(를) 보여줬어요!`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "XP 진행도",
  popupCaught: "잡은 포켓몬",
  popupCandies: "사탕",
  popupPowerUps: "파워업",
  popupPowerUpsEmpty: "아직 파워업이 없어요",
  popupPetVisible: "떠 있는 마스코트",
  popupCustomNewTab: "맞춤 새 탭",
  popupSoundEnabled: "소리와 울음소리",
  popupScale: "크기",
  popupLevelEgg: "알",
  languageLabel: "언어",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "새 탭",
  newtabSearchPlaceholder: "Google 검색...",
  newtabSearchButton: "검색",
  newtabFooter: "포켓몬 친구가 이 탭에도 함께 살아 있어요",
  newtabDisabledMessage:
    "맞춤 탭이 꺼져 있어요 — Pokechi 팝업에서 켜 주세요.",
  newtabShowcaseTitle: "클릭하면 다른 포켓몬을 볼 수 있어요",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "Pokechidex에서 보기",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ 활동!`,
    tab_event: (n) => `+${n} XP 📑 탭!`,
    youtube_song: (n) => `+${n} XP 🎵 노래!`,
    gmail_read: (n) => `+${n} XP ✉️ 메일 읽음!`,
    gmail_deleted: (n) => `+${n} XP 🗑️ 삭제!`,
    page_clicks: (n) => `+${n} XP 🖱️ 클릭!`,
    typing: (n) => `+${n} XP ⌨️ 타이핑!`,
    rare_candy: (n) => `+${n} XP 🍬 이상한사탕!`,
    master_ball: (n) => `+${n} XP ⚪ 마스터볼!`,
    premier_ball: (n) => `+${n} XP 🔴 프리미어볼!`,
    hatch: (n) => `+${n} XP 🥚 부화!`,
    evolution: () => `✨ 진화!`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ 진화!",
  xpMax: "XP 최대",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle: "발견한 포켓몬, 배지, 가방 속 아이템 모음이에요.",
  undiscoveredName: "???",
  counterDiscovered: "발견",
  counterShiny: "이로치",
  counterBadges: "배지",
  counterTotalXP: "총 XP",
  candyCounterNoneYet: (itemName) =>
    `아직 ${itemName}이(가) 없어요 - 포켓볼 부화 시 낮은 확률로 얻을 수 있어요`,
  candyCounterNotUsableNow: (itemName) =>
    `지금은 현재 포켓몬이 ${itemName}을(를) 사용할 수 없어요`,

  bagLabel: "가방",
  bagTabItems: "아이템",
  bagTabBadges: "배지",
  bagTabChallenges: "도전",
  challengesEmpty: "아직 달성한 도전이 없어요 — 달성하면 여기에 표시돼요.",
  itemUseButton: "사용",
  badgeStatusObtained: "획득",
  badgeStatusLocked: "잠김",
  badgeGenerationLabel: (generation) => `${generation}세대`,

  requirementSpeciesDiscovered: "발견한 종",
  requirementShinyDiscovered: "발견한 이로치",
  requirementFossilsDiscovered: "발견한 화석",
  requirementSubLegendariesDiscovered: "발견한 준전설",
  requirementLegendariesDiscovered: "발견한 전설",
  requirementMythicalsDiscovered: "발견한 환상",
  requirementRareCandiesUsed: "사용한 이상한사탕",

  searchPlaceholder: "이름이나 번호로 검색",
  searchAriaLabel: "Pokechidex 검색",
  filtersAriaLabel: "Pokedex 필터",
  filterAll: "전체",
  typeFilterLabel: "타입",
  typeFilterAriaLabel: "타입으로 필터링",
  typeFilterClear: "지우기",
  filterDiscoveredOnly: "발견한 것만",
  filterShinyUnlocked: "이로치 해금됨",
  emptyState: "검색 결과가 없어요.",
  gridAriaLabel: "Pokechidex 그리드",

  cardShowLabel: (name) => `${name} 보기`,
  cardShowLabelActive: (name) => `${name} 보기, 현재 활성 상태`,
  cardUndiscoveredLabel: "발견하지 못한 포켓몬",
  toggleShinyLabel: (name) => `${name}의 이로치 스프라이트 전환`,
  toggleShinyTitle: "이로치 스프라이트 전환",
  playCryLabel: (name) => `${name}의 울음소리 재생`,
  playCryTitle: "울음소리 재생",
  showInfoLabel: (name) => `${name}의 정보 보기`,
  showMovesLabel: (name) => `${name}의 기술 보기`,
  infoTitle: "정보",
  movesTitle: "기술",
  activeBadge: "활성",
};
