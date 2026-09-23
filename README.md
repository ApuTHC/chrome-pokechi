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

* Para compilar en modo observación en vivo:
  ```bash
  npm run watch
  ```
* Cada vez que se modifique el código TypeScript, `esbuild` recompilará los paquetes en menos de 50ms.
