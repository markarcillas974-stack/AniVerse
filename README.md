# AniVerse

AniVerse is a modern anime streaming website that uses the Jikan API to show real anime data, browse categories, search shows, save favorites, and open a details/watch experience without requiring a backend or paid API key.

## Features

- Dark anime-themed streaming interface with purple and blue accents
- Responsive navigation and hero banner
- Search by title with loading and empty-state handling
- Categories for Popular, Top, Upcoming, and Recently Updated anime
- Genre filters and sorting
- Favorites saved with `localStorage`
- Light/dark theme toggle
- Anime details modal with official page links
- Watch page prepared for licensed streaming integration
- GitHub Pages friendly static deployment

## Project structure

- `index.html` – homepage
- `style.css` – styling and responsive layout
- `script.js` – fetch logic, filtering, favorites, theme, and watch functionality
- `watch.html` – dedicated watch page
- `README.md` – setup and deployment instructions

## Local development

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/AniVerse.git
   cd AniVerse
   ```
2. Open `index.html` in your browser, or run a simple local server:
   ```bash
   python -m http.server 8000
   ```
3. Visit:
   ```text
   http://localhost:8000/
   ```

## GitHub Pages deployment

1. Push this project to your GitHub repository.
2. In your GitHub repository, go to:
   - Settings
   - Pages
3. Under "Build and deployment", choose:
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/ (root)`
4. Save the settings.
5. GitHub Pages will give you a URL similar to:
   ```text
   https://<your-username>.github.io/AniVerse/
   ```

## API usage

This project uses the public Jikan API:

- `https://api.jikan.moe/v4`

It fetches anime metadata such as titles, images, ratings, synopsis, genres, and release information. No API key is required.

## Important notes

- The site does not claim to provide anime video streams through Jikan.
- The watch page intentionally shows a legal-streaming reminder when no authorized video source is available.
- If the API fails, the site shows a clear error message instead of fake data.
- All assets are static and work on GitHub Pages without a backend.

## License

This project is for educational/demo use and is not affiliated with Jikan, MyAnimeList, or any streaming platform.
