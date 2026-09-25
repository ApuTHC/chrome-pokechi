import { Strings } from "./strings";

// Item and type names are the official Japanese localization used in the
// games themselves (verified via PokeAPI's item.names/type.names). "Shiny"
// is rendered as 色違い throughout, the original official term the whole
// concept is named after in every other language's own community term.
export const ja: Strings = {
  itemNames: {
    "rare-candy": "ふしぎなアメ",
    "master-ball": "マスターボール",
    "premier-ball": "プレミアボール",
  },
  itemDescriptions: {
    "rare-candy":
      "手持ちのポケモンが完全に進化していなければ、即座に進化させる。",
    "master-ball":
      "全世代からランダムに準伝説・伝説・幻のポケモンを1匹表示する。",
    "premier-ball":
      "全世代・レア度からランダムなポケモンを色違いとして表示する。",
  },
  // Japanese type names are already short enough on their own that a
  // further abbreviation would not save any space, unlike English/Spanish/
  // French/Italian's longer names - so the badge just uses the full,
  // official in-game name for each type.
  typeAbbreviations: {
    normal: "ノーマル",
    fire: "ほのお",
    water: "みず",
    electric: "でんき",
    grass: "くさ",
    ice: "こおり",
    fighting: "かくとう",
    poison: "どく",
    ground: "じめん",
    flying: "ひこう",
    psychic: "エスパー",
    bug: "むし",
    rock: "いわ",
    ghost: "ゴースト",
    dragon: "ドラゴン",
    dark: "あく",
    steel: "はがね",
  },

  badgeEarned: (badgeName) => `🏅 ${badgeName}を獲得した！`,
  challengeEarned: (challengeName) => `🏆 チャレンジ達成：${challengeName}！ プレミアボール+1`,
  challengeNames: {
    "fire-master": "ほのおマスター",
    "water-master": "みずマスター",
    "leaf-master": "くさマスター",
    "classic-shiny": "真のクラシック",
    "fighters": "かくとう家",
    "headaches": "頭痛",
    "city-master": "街の覇者",
    "catch-em-all": "全部ゲット！",
    "brocks-heartbreak": "タケシの失恋",
    "rocket-motto": "世界を荒廃から守るため",
    "joy-legacy": "ジョーイさんの遺産",
    "electric-storm": "電気の嵐",
    "dragon-sanctuary": "ドラゴンの聖域",
    "night-terror": "夜の恐怖",
    "outcast-club": "のけ者クラブ",
    "forest-plague": "森の災い",
  },

  catchNewPokemonConfirm:
    "新しいポケモンを捕まえますか？今出しているポケモンはしまわれます - 進行状況は保存され、Pokechidexからいつでも呼び戻せます。",
  catchNewPokemonButton: "新しいポケモンを捕まえる",

  useItemButton: (itemName) => `${itemName}を使う`,

  masterBallRevealedMessage: (itemName, pokemonName) =>
    `🎉 ${itemName}が${pokemonName}を明らかにした！`,
  masterBallRevealedMessageShiny: (itemName, pokemonName) =>
    `🎉✨ ${itemName}が色違いの${pokemonName}を明らかにした！`,
  premierBallRevealedMessage: (itemName, pokemonName) =>
    `🎉✨ ${itemName}が色違いの${pokemonName}を明らかにした！`,

  // --- Popup (popup.html) -------------------------------------------------
  popupXpProgress: "XPの進行度",
  popupCaught: "捕まえた数",
  popupCandies: "アメ",
  popupPowerUps: "パワーアップ",
  popupPowerUpsEmpty: "パワーアップはまだありません",
  popupPetVisible: "浮遊マスコット",
  popupCustomNewTab: "カスタム新タブ",
  popupSoundEnabled: "サウンドと鳴き声",
  popupScale: "サイズ",
  popupLevelEgg: "タマゴ",
  languageLabel: "言語",

  // --- New tab (newtab.html) ---------------------------------------------
  newtabTitle: "新しいタブ",
  newtabSearchPlaceholder: "Googleで検索...",
  newtabSearchButton: "検索",
  newtabFooter: "ポケモンの相棒はこのタブにも住んでいます",
  newtabDisabledMessage:
    "カスタムタブはオフです — Pokechiのポップアップでオンにしてください。",
  newtabShowcaseTitle: "クリックで別のポケモンが見られます",

  // --- Floating pet -------------------------------------------------------
  petLocateTitle: "Pokechidexで見る",
  xpReasonLabels: {
    active_minute: (n) => `+${n} XP ⏱️ アクティビティ！`,
    tab_event: (n) => `+${n} XP 📑 タブ！`,
    youtube_song: (n) => `+${n} XP 🎵 楽曲！`,
    gmail_read: (n) => `+${n} XP ✉️ メールを読んだ！`,
    gmail_deleted: (n) => `+${n} XP 🗑️ 削除！`,
    page_clicks: (n) => `+${n} XP 🖱️ クリック！`,
    typing: (n) => `+${n} XP ⌨️ 入力！`,
    rare_candy: (n) => `+${n} XP 🍬 ふしぎなアメ！`,
    master_ball: (n) => `+${n} XP ⚪ マスターボール！`,
    premier_ball: (n) => `+${n} XP 🔴 プレミアボール！`,
    hatch: (n) => `+${n} XP 🥚 孵化！`,
    evolution: () => `✨ 進化！`,
    generic: (n) => `+${n} XP`,
  },
  evolvedNotification: "✨ 進化！",
  xpMax: "XP 最大",

  // --- Pokedex page (pokedex.html) ---------------------------------------
  pokedexSubtitle: "発見したポケモン、バッジ、バッグのアイテムコレクション。",
  undiscoveredName: "???",
  counterDiscovered: "発見数",
  counterShiny: "色違い",
  counterBadges: "バッジ",
  counterTotalXP: "合計XP",
  candyCounterNoneYet: (itemName) =>
    `まだ${itemName}を持っていません - モンスターボールが孵化すると、低確率で1つ手に入ります`,
  candyCounterNotUsableNow: (itemName) =>
    `今のポケモンは今は${itemName}を使えません`,

  bagLabel: "バッグ",
  bagTabItems: "アイテム",
  bagTabBadges: "バッジ",
  bagTabChallenges: "チャレンジ",
  challengesEmpty: "まだ達成したチャレンジはありません——達成するとここに表示されます。",
  challengeObjectives: {
    "fire-master": "ほのお御三家4ラインを完成させる（Charizard、Typhlosion、Blaziken、Infernape）。",
    "water-master": "みず御三家4ラインを完成させる（Blastoise、Feraligatr、Swampert、Empoleon）。",
    "leaf-master": "くさ御三家4ラインを完成させる（Venusaur、Meganium、Sceptile、Torterra）。",
    "classic-shiny": "色違いGyaradosを手に入れる。",
    "fighters": "HitmonleeとHitmonchanを手に入れる。",
    "headaches": "Mewtwoを手に入れる。",
    "city-master": "いずれか1つの世代の全ポケモンを完成させる（初めて完成させたときのみ付与）。",
    "catch-em-all": "Pokechidex全体を完成させる（全世代の全ポケモン）。",
    "brocks-heartbreak": "Onix、Steelix、Geodude、Sudowoodoを手に入れる。",
    "rocket-motto": "Meowth、Arbok、Weezing、Seviperを手に入れる。",
    "joy-legacy": "TogepiとChanseyを手に入れる。",
    "electric-storm": "Pikachu、Electabuzz、Ampharosを手に入れる。",
    "dragon-sanctuary": "Dragonite、Salamence、Garchompを手に入れる。",
    "night-terror": "Gengar、Misdreavus、Sableyeを手に入れる。",
    "outcast-club": "Rattata、Sentret、Zigzagoon、Bidoofを手に入れる。",
    "forest-plague": "Butterfree、Scizor、Heracrossを手に入れる。",
  },
  challengePowerUps: {
    "fire-master": "手持ちポケモンがほのおタイプならXP x2",
    "water-master": "手持ちポケモンがみずタイプならXP x2",
    "leaf-master": "手持ちポケモンがくさタイプならXP x2",
    "classic-shiny": "手持ちポケモンが色違いならXP x2",
    "fighters": "手持ちポケモンがかくとうタイプならXP x2",
    "headaches": "手持ちポケモンがエスパータイプならXP x2",
    "city-master": "いつでもどのポケモンでもXP x2",
    "catch-em-all": "今後の発見は必ず色違いになる",
    "brocks-heartbreak": "手持ちポケモンがいわタイプならXP x2",
    "rocket-motto": "手持ちポケモンがどくタイプならXP x2",
    "joy-legacy": "ポケモンがモンスターボール状態の間のみXP x2",
    "electric-storm": "手持ちポケモンがでんきタイプならXP x2",
    "dragon-sanctuary": "手持ちポケモンがドラゴンタイプならXP x2",
    "night-terror": "手持ちポケモンがゴーストタイプならXP x2",
    "outcast-club": "手持ちポケモンがノーマルタイプならXP x2",
    "forest-plague": "手持ちポケモンがむしタイプならXP x2",
  },
  itemUseButton: "使う",
  badgeStatusObtained: "獲得済み",
  badgeStatusLocked: "未獲得",
  badgeGenerationLabel: (generation) => `第${generation}世代`,

  requirementSpeciesDiscovered: "発見した種族数",
  requirementShinyDiscovered: "発見した色違い数",
  requirementFossilsDiscovered: "発見した化石数",
  requirementSubLegendariesDiscovered: "発見した準伝説数",
  requirementLegendariesDiscovered: "発見した伝説数",
  requirementMythicalsDiscovered: "発見した幻数",
  requirementRareCandiesUsed: "使用したふしぎなアメ数",

  searchPlaceholder: "名前または番号で検索",
  searchAriaLabel: "Pokechidexを検索",
  filtersAriaLabel: "Pokedexのフィルター",
  filterAll: "すべて",
  typeFilterLabel: "タイプ",
  typeFilterAriaLabel: "タイプで絞り込む",
  typeFilterClear: "クリア",
  filterDiscoveredOnly: "発見済みのみ",
  filterShinyUnlocked: "色違い解放済み",
  emptyState: "検索条件に一致するものがありません。",
  gridAriaLabel: "Pokechidexグリッド",

  cardShowLabel: (name) => `${name}を表示`,
  cardShowLabelActive: (name) => `${name}を表示、現在アクティブ`,
  cardUndiscoveredLabel: "未発見のポケモン",
  toggleShinyLabel: (name) => `${name}の色違いスプライトを切り替え`,
  toggleShinyTitle: "色違いスプライトを切り替え",
  playCryLabel: (name) => `${name}の鳴き声を再生`,
  playCryTitle: "鳴き声を再生",
  showInfoLabel: (name) => `${name}の情報を表示`,
  showMovesLabel: (name) => `${name}の技を表示`,
  infoTitle: "情報",
  movesTitle: "技",
  activeBadge: "アクティブ",
};
