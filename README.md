# AniVerse

AniVerse is a responsive anime streaming website built with HTML, CSS, and JavaScript. It connects to the real Jikan API v4 to display actual anime data, including top titles, seasonal picks, upcoming anime, search results, details, and episode lists.

## Features

- Real API integration using Jikan API v4
- Dark anime-themed UI with responsive layout
- Search with live API results
- Top Anime, Popular Anime, Upcoming Anime, and Search sections
- Anime detail page with actual API ID lookup
- Episode list from the Jikan episodes endpoint
- Favorites saved in localStorage
- Genre filters and load more action
- Loading spinners and API error handling
- GitHub Pages-ready relative paths

## Project Structure

- `index.html` – homepage
- `details.html` – anime details page
- `watch.html` – watch page with official provider guidance
- `style.css` – global styling and layout
- `script.js` – API logic and JavaScript behavior

## Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/markarcillas974-stack/AniVerse.git
   cd AniVerse
   ```

2. Open `index.html` in a browser, or run a local static server:
   ```bash
   python -m http.server 8000
   ```

3. Visit `http://localhost:8000` in your browser.

## Deploy to GitHub Pages

1. Push the project to GitHub.
2. In your GitHub repository, open:
   `Settings > Pages`
3. Set the source to:
   - Branch: `main`
   - Folder: `/ (root)`
4. Save the settings.
5. GitHub will provide a Pages URL for the site.

## Notes on API Usage

- This project uses the public Jikan API without a backend or API key.
- The app uses `fetch()` and `async/await` with real endpoints such as:
  - `https://api.jikan.moe/v4/top/anime`
  - `https://api.jikan.moe/v4/seasons/now`
  - `https://api.jikan.moe/v4/seasons/upcoming`
  - `https://api.jikan.moe/v4/anime?q=...`
  - `https://api.jikan.moe/v4/anime/{id}/full`
  - `https://api.jikan.moe/v4/anime/{id}/episodes`
- The Jikan API does not provide direct episode video streams. For the watch page, the site shows official provider links and a clear message when no playable stream is available.

## License

This project is for educational and demo purposes.
