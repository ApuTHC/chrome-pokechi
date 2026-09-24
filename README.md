# 🐾 Pokechi - Extensión para Chrome & Brave

¡Tu compañero Pokémon en el navegador! Cuida y evoluciona a tu Pokémon mientras navegas por internet, escuchas música o trabajas.

---

## 🚀 Características

* **Mascota Flotante sobre las Pestañas**: Tu Pokémon camina por la parte inferior de cualquier página web que visites. Al pasar el ratón se detiene en reposo (*idle*), al hacer clic emite su grito característico (*cry*), y puedes arrastrarlo a cualquier parte de la pantalla.
* **Aislamiento Total (Shadow DOM)**: Los estilos de la mascota no interfieren con las páginas web que visitas, ni el CSS de las webs rompe al Pokémon.
* **Mini Barra de XP**: Barra sutil con nivel, progreso en tiempo real y notificaciones flotantes al ganar experiencia.
* **Pokédex Completa (Generaciones 1 a 4)**: Catálogo con 553 especies, descripciones, ataques, variantes Shiny y medallas de gimnasio.
* **Mochila de Objetos**: Caramelos Raros, Master Balls y Premier Balls para ayudarte a evolucionar o descubrir nuevas especies.

---

## ⚡ Cómo se Gana Experiencia (XP)

| Actividad | Puntos | Descripción |
| :--- | :---: | :--- |
| **Tiempo de Navegación** | **+5 XP** | Por cada minuto activo en el navegador. |
| **Pestañas** | **+7 XP** | Al abrir o cerrar pestañas. |
| **YouTube** | **+10 XP** | Al escuchar una canción o video completo (sin saltos). |
| **Gmail (Lectura)** | **+5 XP** | Al abrir y leer un correo nuevo no leído. |
| **Gmail (Eliminar)** | **+2 XP** | Al eliminar un correo (botón papelera o tecla `#`). |
| **Interacción** | **+1 XP** | Cada 10 clics en cualquier página web. |
| **Escritura** | **+1 XP** | Por cada letra escrita o borrada en inputs/textareas (100% privado, **cero keylogger**, contraseñas excluidas). |

---

## 🛠️ Instalación en Brave o Chrome

1. Clona o ubica esta carpeta:
   ```bash
   cd chrome-pokechi
   ```
2. Instala dependencias y compila:
   ```bash
   npm install
   npm run build
   ```
3. Abre tu navegador (**Brave** o **Chrome**):
   * En Brave ve a: `brave://extensions`
   * En Chrome ve a: `chrome://extensions`
4. Activa el **"Modo de desarrollador"** (Developer mode) en la esquina superior derecha.
5. Haz clic en **"Cargar descomprimida"** (Load unpacked).
6. Selecciona la carpeta `chrome-pokechi`.
7. ¡Listo! Verás a tu compañero Pokémon aparecer en las páginas que visites y el icono en la barra de extensiones.

---

## 💻 Desarrollo

### Scripts

| Script | Qué hace |
| :--- | :--- |
| `npm run build` | Compila los 5 bundles + las hojas de colores en `dist/` (modo desarrollo, con sourcemaps). **Es el flujo por defecto.** |
| `npm run build:prod` | Igual pero minificado: es lo que se publica. |
| `npm run watch` | Reconecta `esbuild` en modo observación (<50 ms por guardado). |
| `npm run typecheck` | `tsc --noEmit` (TypeScript en modo `strict`). |
| `npm run check` | `typecheck` + `build` en un solo paso: la puerta de toda tarea. |
| `npm run check:contrast` | Auditoría de contraste WCAG 1.4.3 sobre pares texto/fondo reales (ver más abajo). |
| `npm test` | Tests unitarios con `vitest` (`game-logic.ts` y `xp.ts`: XP, eclosiones, drops, objetos, insignias). |
| `npm run lint` / `npm run format` | ESLint y Prettier. |

**CI**: `.github/workflows/ci.yml` ejecuta en cada push/PR a `main`
`npm ci && npm run check && npm run lint && npm test && npm run check:contrast && npm run build:prod`,
así que un roto en tipos, build, contraste o tests bloquea el merge.

* Cada vez que se modifique el código TypeScript, `esbuild` recompilará los paquetes en menos de 50ms.
* `build.js` además escribe `dist/type-badges.css` y `dist/rarity-borders.css` a partir de
  `src/common/type-badges.ts` y `src/common/rarity-colors.ts`, de modo que los colores de tipo y
  rareza tienen **una única fuente** y las páginas los cargan como CSS, no como JS.

### 📊 Tamaños de bundle

| Bundle | Línea base | Hoy (dev) | Hoy (prod) |
| :--- | ---: | ---: | ---: |
| `dist/content.js` | 253.5 KB | 214.8 KB | **126.6 KB** |
| `dist/content-sites.js` | *(no existía)* | 6.3 KB | 2.7 KB |
| `dist/newtab.js` | 253.5 KB | 220.2 KB | **129.6 KB** |
| `dist/popup.js` | 231.9 KB | 193.1 KB | **111.0 KB** |
| `dist/background.js` | 238.9 KB | 234.1 KB | **141.2 KB** |
| `dist/pokedex.js` | **1.23 MB** | 244.6 KB | **154.3 KB** |
| `dist/type-badges.css` | — | 1.2 KB | 1.2 KB |
| `dist/rarity-borders.css` | — | 0.5 KB | 0.5 KB |

La columna *dev* es la comparación justa con la línea base (mismo tipo de build); *prod* es lo que
se sube a la tienda. Ganancias: `content.js` −50 % (se inyecta en todas las pestañas) y
`pokedex.js` −87 % (dos diccionarios de datos completos dejaron de viajar juntos).

> **Desviación R1 documentada**: el plan pedía que `dist/content.js` no contuviera cadenas de
> i18n (`grep "earned!" dist/content.js` → vacío), pero L5 exige que las notificaciones de la
> mascota estén localizadas, y estas viven en los diccionarios. Se decidió mantener los 8
> diccionarios en el bundle y medir el coste: **48 KB de 245 KB de entrada** (~19 %, el
> `pokemon-data.ts` que sí se aceptó ya son 135 KB). El objetivo de `<100 KB` sin minificar era
> inalcanzable por esa misma tabla de datos; con minificado el script inyectado pesa 126.6 KB.

### 🔁 Arquitectura de mensajes y sincronización

* **`src/common/messages.ts`** — protocolo tipado único: unión discriminada `PokechiRequest`,
  mapa de respuestas por tipo, guard de tipos para lo que llega de fuera y el helper
  `sendPokechiMessage()` que **nunca rechaza** (un service worker ausente devuelve
  `{ success: false, error }`).
* **Estado persistente → `chrome.storage.onChanged`** (`src/common/state-sync.ts`): la clave
  `pokechi_state` la escribe solo el background y popup, Pokédex, nueva pestaña y la mascota se
  suscriben. Se sustituyó al broadcast completo de estado en cada mutación.
* **Evento XP transitorio → mensaje `POKECHI_XP_EVENT`**: solo lleva lo que la mascota anima
  encima del estado (`+N XP`, evolución, medallas ganadas), coalescido por ventana para que un
  burst de XP no dispare 10 animaciones.

### 🌍 Idiomas

Ocho diccionarios en `src/common/i18n/` (**en, es, pt, fr, it, ko, zh, ja**) con el tipo `Strings`
como fuente de verdad: faltar una clave en un idioma es **error de compilación**. El selector está
en el popup (`Language`), el valor vive en `settings.language` y lo consumen popup, Pokédex,
nueva pestaña, notificaciones de la mascota y las abreviaturas de tipo. Los HTML declaran
`lang="en"` de fábrica y la capa de idioma los actualiza al arrancar.

### 🔒 Permisos

`manifest.json` pide solo `storage`, `tabs`, `alarms`, `topSites` y `favicon`:
**sin `host_permissions`** (los content scripts declarados en `matches` cubren lo necesario) y sin
`notifications`. Los recursos (`media/*`) se exponen como *web accessible resources* para que la
mascota pueda pintar los sprites en cualquier página.

### ♿ Accesibilidad y diseño

* **Design tokens**: `src/styles/tokens.css` (popup, nueva pestaña y Pokédex) +
  `src/common/design-tokens.ts` (espejo para el shadow DOM de la mascota). Cambiar un token cambia
  las cuatro superficies.
* **Contraste**: `npm run check:contrast` valida 61 pares texto/fondo con la fórmula
  `(L1+0.05)/(L2+0.05) ≥ 4.5` (3:1 para anillos de foco y barras). Todos pasan.
* **Foco**: anillo `:focus-visible` de 2 px (`--focus`) en las tres páginas y también dentro del
  shadow DOM de la mascota; la barra XP se revela con `:focus-within` para que el foco no caiga en
  algo invisible.
* **Targets**: todo elemento clicable mide ≥ 24×24 CSS px (WCAG 2.5.8).
* **Movimiento**: `@media (prefers-reduced-motion: reduce)` en las tres hojas y en el shadow DOM;
  el `scrollIntoView` de "localizar en la Pokédex" se vuelve instantáneo con la misma preferencia.

