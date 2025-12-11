# Clicker Heroes Save Editor (CHSE)

A web-based save file editor for **Clicker Heroes**, featuring a modern "Wiki-like" dark UI and user-friendly experience.

## Features
- **Resources Editing**: Edit Gold, Rubies, Hero Souls, Ancient Souls, etc.
- **Hero Management**: Level up, gild, and unlock upgrades for all heroes.
- **Ancient & Outsider Levels**: Easily adjust levels for ancients and outsiders.
- **Mercenaries & Relics**: Revive/Immortalize mercenaries and edit relic stats.
- **Modern UI**: Dark theme with cyan accents, inspired by the Clicker Heroes Wiki.
- **Toast Notifications**: Non-intrusive notifications instead of blocking alerts.

## Usage
1. Open `index.html` in a modern web browser.
2. Click **[ LOAD FILE ]** to import your save data (`.txt` file).
3. Edit the values as desired across the various tabs.
4. Click **[ SAVE DATA ]** to download the modified save file.
5. Import the new save file back into Clicker Heroes.

## Development
- **Framework**: Vue.js 3 (CDN)
- **Styling**: Vanilla CSS (CSS Variables for theming)
- **Compression**: pako.js (for zlib save data handling)

## Credits
Created by Nexy451z.
