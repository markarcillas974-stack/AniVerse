const API_BASE = "https://api.jikan.moe/v4";
const FAVORITES_KEY = "aniverse-favorites";
const PAGE_LIMIT = 12;

const state = {
  favorites: loadFavorites(),
  topPage: 1,
  upcomingPage: 1,
  searchGenre: "All",
  lastRequestTime: 0,
};

const toastTimer = { id: null };

// This app fetches real anime data from the Jikan API v4.
// We use async/await with fetch() so the UI stays responsive.
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  renderFavoritesSection();
  bindGlobalSearch();

  if (page === "home") {
    initializeHomePage();
  }

  if (page === "details") {
    initializeDetailsPage();
  }

  if (page === "watch") {
    initializeWatchPage();
  }
});

function bindGlobalSearch() {
  const searchInput = document.getElementById("animeSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", debounce((event) => {
    const query = event.target.value.trim();
    if (!query) {
      document.getElementById("searchStatus").textContent = "Type a title to search";
      renderSearchResults([]);
      return;
    }

    performSearch(query);
  }, 350));
}

function initializeHomePage() {
  loadFeaturedAnime();
  loadTopAnime(true);
  loadPopularAnime();
  loadUpcomingAnime(true);
  renderGenreFilters();
  wireLoadMoreButtons();
  renderFavoritesSection();
}

function wireLoadMoreButtons() {
  const topLoadMoreButton = document.getElementById("topAnimeLoadMore");
  const upcomingLoadMoreButton = document.getElementById("upcomingAnimeLoadMore");

  if (topLoadMoreButton) {
    topLoadMoreButton.addEventListener("click", () => loadTopAnime(false));
  }

  if (upcomingLoadMoreButton) {
    upcomingLoadMoreButton.addEventListener("click", () => loadUpcomingAnime(false));
  }
}

async function loadFeaturedAnime() {
  try {
    const data = await fetchJson(`${API_BASE}/top/anime?limit=1`);
    const anime = data.data[0];

    if (!anime) return;

    const banner = document.getElementById("featuredBanner");
    const title = document.getElementById("featuredTitle");
    const synopsis = document.getElementById("featuredSynopsis");
    const meta = document.getElementById("featuredMeta");
    const detailsLink = document.getElementById("featuredDetailsLink");
    const favoriteBtn = document.getElementById("featuredFavoriteBtn");

    if (!banner || !title || !synopsis || !meta || !detailsLink || !favoriteBtn) return;

    const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
    banner.style.backgroundImage = `linear-gradient(90deg, rgba(5,9,18,0.9), rgba(5,9,18,0.6)), url('${imageUrl}')`;
    title.textContent = anime.title || "Featured Anime";
    synopsis.textContent = truncateText(anime.synopsis || "A fan-favorite anime from the latest rankings.", 220);
    meta.innerHTML = `
      <span>⭐ ${anime.score || "N/A"}</span>
      <span>Episodes: ${anime.episodes || "N/A"}</span>
      <span>${anime.genres?.[0]?.name || "Anime"}</span>
    `;
    detailsLink.href = `./details.html?id=${anime.mal_id}`;

    favoriteBtn.textContent = isFavorite(anime.mal_id) ? "Saved" : "Add to Favorites";
    favoriteBtn.classList.toggle("active", isFavorite(anime.mal_id));
    favoriteBtn.onclick = () => toggleFavorite(anime);
  } catch (error) {
    showApiError(error.message, "error");
  }
}

async function loadTopAnime(reset = false) {
  const grid = document.getElementById("topAnimeGrid");
  const button = document.getElementById("topAnimeLoadMore");

  if (!grid) return;

  if (reset) {
    grid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    state.topPage = 1;
  }

  try {
    const data = await fetchJson(`${API_BASE}/top/anime?page=${state.topPage}&limit=${PAGE_LIMIT}`);
    const items = data.data || [];

    if (reset) {
      grid.innerHTML = "";
    }

    items.forEach((anime) => {
      renderAnimeCard(anime, grid);
    });

    state.topPage += 1;

    if (button && items.length < PAGE_LIMIT) {
      button.disabled = true;
      button.textContent = "No More";
    }
  } catch (error) {
    grid.innerHTML = "";
    showApiError(error.message, "error");
  }
}

async function loadPopularAnime() {
  const grid = document.getElementById("popularAnimeGrid");
  if (!grid) return;

  grid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  try {
    const data = await fetchJson(`${API_BASE}/top/anime?limit=8`);
    grid.innerHTML = "";
    (data.data || []).forEach((anime) => renderAnimeCard(anime, grid));
  } catch (error) {
    grid.innerHTML = "";
    showApiError(error.message, "error");
  }
}

async function loadUpcomingAnime(reset = false) {
  const grid = document.getElementById("upcomingAnimeGrid");
  const button = document.getElementById("upcomingAnimeLoadMore");

  if (!grid) return;

  if (reset) {
    grid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    state.upcomingPage = 1;
  }

  try {
    const data = await fetchJson(`${API_BASE}/seasons/upcoming?page=${state.upcomingPage}&limit=${PAGE_LIMIT}`);
    const items = data.data || [];

    if (reset) {
      grid.innerHTML = "";
    }

    items.forEach((anime) => renderAnimeCard(anime, grid));

    state.upcomingPage += 1;

    if (button && items.length < PAGE_LIMIT) {
      button.disabled = true;
      button.textContent = "No More";
    }
  } catch (error) {
    grid.innerHTML = "";
    showApiError(error.message, "error");
  }
}

function renderGenreFilters() {
  const genreFilters = document.getElementById("genreFilters");
  if (!genreFilters) return;

  const genres = [
    "All",
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Sports",
    "Mystery",
    "Horror",
  ];

  genreFilters.innerHTML = "";
  genres.forEach((genre) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `genre-chip ${genre === state.searchGenre ? "active" : ""}`;
    button.textContent = genre;
    button.addEventListener("click", () => {
      state.searchGenre = genre;
      renderGenreFilters();
      const searchInput = document.getElementById("animeSearchInput");
      if (searchInput && searchInput.value.trim()) {
        performSearch(searchInput.value.trim());
      }
    });
    genreFilters.appendChild(button);
  });
}

async function performSearch(query) {
  const status = document.getElementById("searchStatus");
  const resultsGrid = document.getElementById("searchResultsGrid");

  if (!status || !resultsGrid) return;

  status.textContent = "Searching...";
  resultsGrid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  try {
    const data = await fetchJson(`${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=12`);
    const items = data.data || [];
    const filteredItems = filterByGenre(items, state.searchGenre);

    renderSearchResults(filteredItems, query);
  } catch (error) {
    resultsGrid.innerHTML = "";
    showApiError(error.message, "error");
  }
}

function renderSearchResults(items, query = "") {
  const status = document.getElementById("searchStatus");
  const resultsGrid = document.getElementById("searchResultsGrid");
  if (!status || !resultsGrid) return;

  if (!items.length) {
    status.textContent = query ? `No results for "${query}"` : "Type a title to search";
    resultsGrid.innerHTML = '<div class="api-message info">No anime matched your search.</div>';
    return;
  }

  status.textContent = `${items.length} result${items.length > 1 ? "s" : ""}`;
  resultsGrid.innerHTML = "";
  items.forEach((anime) => renderAnimeCard(anime, resultsGrid));
}

function renderAnimeCard(anime, container) {
  const template = document.getElementById("animeCardTemplate");
  if (!template || !container) return;

  const card = template.content.firstElementChild.cloneNode(true);
  const poster = card.querySelector(".anime-poster");
  const title = card.querySelector(".anime-title");
  const score = card.querySelector(".anime-score");
  const episodes = card.querySelector(".anime-episodes");
  const synopsis = card.querySelector(".anime-synopsis");
  const tagsBox = card.querySelector(".anime-tags");
  const favoriteButton = card.querySelector(".favorite-btn");

  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "https://placehold.co/400x560/0f172a/ffffff?text=AniVerse";

  poster.src = imageUrl;
  poster.alt = `${anime.title} poster`;
  title.textContent = anime.title || "Unknown Anime";
  score.textContent = `⭐ ${anime.score || "N/A"}`;
  episodes.textContent = `Ep ${anime.episodes || "N/A"}`;
  synopsis.textContent = truncateText(anime.synopsis || "No synopsis available yet.", 120);

  const tags = (anime.genres || []).slice(0, 3).map((genre) => {
    const tag = document.createElement("span");
    tag.className = "anime-tag";
    tag.textContent = genre.name;
    return tag;
  });

  tags.forEach((tag) => tagsBox.appendChild(tag));

  const isSaved = isFavorite(anime.mal_id);
  favoriteButton.classList.toggle("active", isSaved);
  favoriteButton.textContent = isSaved ? "♥" : "♡";

  favoriteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(anime);
    renderAnimeCardState(card, anime);
  });

  card.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    window.location.href = `./details.html?id=${anime.mal_id}`;
  });

  container.appendChild(card);
}

function renderAnimeCardState(card, anime) {
  const favoriteButton = card.querySelector(".favorite-btn");
  if (!favoriteButton) return;

  const saved = isFavorite(anime.mal_id);
  favoriteButton.classList.toggle("active", saved);
  favoriteButton.textContent = saved ? "♥" : "♡";
}

function initializeDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("id");
  const backButton = document.getElementById("backButton");

  if (backButton) {
    backButton.addEventListener("click", () => history.back());
  }

  if (!animeId) {
    showApiError("No anime ID was provided in the URL.", "error");
    return;
  }

  loadAnimeDetail(animeId);
}

async function loadAnimeDetail(animeId) {
  const container = document.getElementById("animeDetailCard");
  const errorBox = document.getElementById("detailError");
  const episodeList = document.getElementById("episodeList");

  if (!container) return;

  container.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  try {
    const [animeRes, episodesRes] = await Promise.all([
      fetchJson(`${API_BASE}/anime/${animeId}/full`),
      fetchJson(`${API_BASE}/anime/${animeId}/episodes?limit=50`),
    ]);

    const anime = animeRes.data;
    const episodes = episodesRes.data || [];

    renderAnimeDetail(anime);
    renderEpisodeList(episodes, anime);

    if (errorBox) {
      errorBox.classList.add("hidden");
    }
  } catch (error) {
    container.innerHTML = "";
    if (errorBox) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("hidden");
    }
  }

  if (episodeList) {
    episodeList.innerHTML = "";
  }
}

function renderAnimeDetail(anime) {
  const container = document.getElementById("animeDetailCard");
  if (!container) return;

  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const genres = (anime.genres || []).map((genre) => `<span class="detail-tag">${genre.name}</span>`).join("");
  const streamingLinks = (anime.streaming || []).slice(0, 4).map((item) => {
    return `<a class="provider-link" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name}</a>`;
  }).join("");

  container.innerHTML = `
    <div class="detail-layout">
      <img class="detail-poster" src="${imageUrl}" alt="${anime.title} poster" />

      <div class="detail-body">
        <div class="detail-header">
          <div>
            <p class="eyebrow">Anime Details</p>
            <h1 class="detail-title">${anime.title || "Unknown Anime"}</h1>
          </div>
          <button class="favorite-btn ${isFavorite(anime.mal_id) ? "active" : ""}" type="button" data-favorite-id="${anime.mal_id}" data-favorite-title="${escapeHtml(anime.title || "Anime")}" data-favorite-image="${imageUrl}">${isFavorite(anime.mal_id) ? "♥" : "♡"}</button>
        </div>

        <div class="detail-meta">
          <span>⭐ ${anime.score || "N/A"}</span>
          <span>Episodes: ${anime.episodes || "N/A"}</span>
          <span>Year: ${anime.year || "N/A"}</span>
          <span>Status: ${anime.status || "Unknown"}</span>
        </div>

        <div class="detail-actions">
          <a class="watch-btn" href="./watch.html?id=${anime.mal_id}">Watch Now</a>
          <button class="secondary-btn" type="button" data-favorite-id="${anime.mal_id}" data-favorite-title="${escapeHtml(anime.title || "Anime")}" data-favorite-image="${imageUrl}">${isFavorite(anime.mal_id) ? "Remove Favorite" : "Add Favorite"}</button>
        </div>

        <p class="detail-summary">${anime.synopsis || "No synopsis available yet."}</p>

        <div class="detail-tags">${genres}</div>

        <div>
          <p class="eyebrow">Official Streams</p>
          <div class="provider-list">${streamingLinks || '<span class="api-message info">No official streaming links were returned by the API for this title.</span>'}</div>
        </div>
      </div>
    </div>
  `;

  const favoriteMainButton = container.querySelector("[data-favorite-id]");
  const secondaryFavoriteButton = container.querySelector(".secondary-btn[data-favorite-id]");

  [favoriteMainButton, secondaryFavoriteButton].forEach((button) => {
    if (!button) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      toggleFavorite({
        mal_id: Number(button.dataset.favoriteId),
        title: button.dataset.favoriteTitle,
        images: { jpg: { large_image_url: button.dataset.favoriteImage } },
      });
      renderAnimeDetail({
        ...anime,
        title: anime.title,
        images: anime.images,
        mal_id: anime.mal_id,
      });
    });
  });
}

function renderEpisodeList(episodes, anime = {}) {
  const list = document.getElementById("episodeList");
  if (!list) return;

  if (!episodes.length) {
    list.innerHTML = '<div class="api-message info">No episodes were returned by the API for this title.</div>';
    return;
  }

  list.innerHTML = "";
  episodes.slice(0, 24).forEach((episode) => {
    const button = document.createElement("a");
    button.href = `./watch.html?id=${anime.mal_id || new URLSearchParams(window.location.search).get("id")}&episode=${episode.episode}`;
    button.className = "episode-button";
    button.innerHTML = `<strong>Ep ${episode.episode}</strong><span>${episode.title || "Episode"}</span>`;
    list.appendChild(button);
  });
}

function initializeWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("id");
  const episodeParam = params.get("episode");
  const backButton = document.getElementById("watchBackButton");

  if (backButton) {
    backButton.addEventListener("click", () => history.back());
  }

  if (!animeId) {
    showApiError("No anime ID was provided for the watch page.", "error", "watchError");
    return;
  }

  loadWatchAnime(animeId, episodeParam);
}

async function loadWatchAnime(animeId, episodeParam) {
  const errorBox = document.getElementById("watchError");

  try {
    const [animeRes, episodesRes] = await Promise.all([
      fetchJson(`${API_BASE}/anime/${animeId}/full`),
      fetchJson(`${API_BASE}/anime/${animeId}/episodes?limit=50`),
    ]);

    const anime = animeRes.data;
    const episodes = episodesRes.data || [];

    renderWatchPage(anime, episodes, episodeParam);
    if (errorBox) errorBox.classList.add("hidden");
  } catch (error) {
    if (errorBox) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("hidden");
    }
  }
}

function renderWatchPage(anime, episodes, selectedEpisode) {
  const watchPlayer = document.getElementById("watchPlayer");
  const providerList = document.getElementById("providerList");
  const watchAnimeMeta = document.getElementById("watchAnimeMeta");
  const watchEpisodeList = document.getElementById("watchEpisodeList");

  if (!watchPlayer || !providerList || !watchAnimeMeta || !watchEpisodeList) return;

  const selectedValue = Number(selectedEpisode) || 1;
  const targetEpisode = episodes.find((episode) => Number(episode.episode) === selectedValue) || episodes[0];

  watchAnimeMeta.innerHTML = `
    <p class="eyebrow">Now Watching</p>
    <h2>${anime.title || "Anime"}</h2>
    <p>${truncateText(anime.synopsis || "No synopsis available.", 180)}</p>
    <div class="detail-meta">
      <span>⭐ ${anime.score || "N/A"}</span>
      <span>Episodes: ${anime.episodes || "N/A"}</span>
      <span>${anime.year || "N/A"}</span>
    </div>
    <a class="watch-btn" href="./details.html?id=${anime.mal_id}" style="margin-top: 10px;">Back to Details</a>
  `;

  const officialProviders = anime.streaming || [];

  if (officialProviders.length) {
    providerList.innerHTML = officialProviders.slice(0, 5).map((platform) => {
      return `<a class="provider-link" href="${platform.url}" target="_blank" rel="noopener noreferrer">${platform.name}</a>`;
    }).join("");

    watchPlayer.innerHTML = `
      <div class="watch-placeholder">
        <div class="placeholder-icon">▶</div>
        <h2>Official provider selected</h2>
        <p>Jikan does not provide direct video files, but this title has official streaming links available.</p>
        <a class="primary-btn" href="${officialProviders[0].url}" target="_blank" rel="noopener noreferrer">Open Official Provider</a>
      </div>
    `;
  } else {
    providerList.innerHTML = "";
    watchPlayer.innerHTML = `
      <div class="watch-placeholder">
        <div class="placeholder-icon">⚠</div>
        <h2>No playable stream available</h2>
        <p>Jikan does not provide direct episode streams. Please watch on an official service such as Crunchyroll, Netflix, HIDIVE, or the anime's licensed provider.</p>
      </div>
    `;
  }

  watchEpisodeList.innerHTML = "";
  episodes.forEach((episode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `episode-button ${Number(episode.episode) === Number(targetEpisode?.episode) ? "active" : ""}`;
    button.innerHTML = `<strong>Ep ${episode.episode}</strong><span>${episode.title || "Episode"}</span>`;
    button.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("episode", episode.episode);
      window.location.href = url.toString();
    });
    watchEpisodeList.appendChild(button);
  });
}

function renderFavoritesSection() {
  const grid = document.getElementById("favoritesGrid");
  if (!grid) return;

  const favorites = loadFavorites();
  grid.innerHTML = "";

  if (!favorites.length) {
    grid.innerHTML = '<div class="api-message info">No favorite anime yet. Tap the heart on any card to save it.</div>';
    return;
  }

  favorites.forEach((anime) => renderAnimeCard(anime, grid));
}

function toggleFavorite(anime) {
  const list = loadFavorites();
  const id = Number(anime.mal_id || anime.id);
  const index = list.findIndex((item) => Number(item.mal_id) === id);

  if (index >= 0) {
    list.splice(index, 1);
    showToast("Removed from favorites");
  } else {
    list.unshift({
      mal_id: id,
      title: anime.title,
      synopsis: anime.synopsis || "",
      score: anime.score || "N/A",
      episodes: anime.episodes || "N/A",
      images: anime.images || { jpg: { large_image_url: "https://placehold.co/400x560/0f172a/ffffff?text=AniVerse" } },
      genres: anime.genres || [],
    });
    showToast("Added to favorites");
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  state.favorites = list;
  renderFavoritesSection();
  const favoriteButtons = document.querySelectorAll(".favorite-btn");
  favoriteButtons.forEach((button) => {
    const targetId = Number(button.dataset.favoriteId || button.closest("[data-favorite-id]")?.dataset.favoriteId || button.getAttribute("data-favorite-id"));
    if (targetId === id) {
      const active = isFavorite(id);
      button.classList.toggle("active", active);
      button.textContent = active ? "♥" : "♡";
    }
  });
}

function isFavorite(id) {
  return loadFavorites().some((item) => Number(item.mal_id) === Number(id));
}

function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer.id);
  toastTimer.id = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function showApiError(message, type = "error", targetId = "api-error") {
  const target = document.getElementById(targetId) || document.getElementById("api-error");
  if (!target) return;

  target.textContent = message;
  target.className = `api-message ${type}`;
  target.classList.remove("hidden");
}

async function fetchJson(url) {
  const now = Date.now();
  const diff = now - state.lastRequestTime;

  if (diff < 250) {
    await new Promise((resolve) => setTimeout(resolve, 250 - diff));
  }

  state.lastRequestTime = Date.now();

  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error("Rate limit reached. Please wait a moment and try the request again.");
  }

  if (!response.ok) {
    throw new Error(`The anime API request failed with status ${response.status}.`);
  }

  const data = await response.json();

  if (!data || !data.data) {
    throw new Error("No anime data was returned by the API.");
  }

  return data;
}

function truncateText(text, maxLength) {
  if (!text) return "No description available.";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function filterByGenre(items, genre) {
  if (!genre || genre === "All") return items;

  return items.filter((anime) => {
    const genres = (anime.genres || []).map((entry) => entry.name);
    return genres.includes(genre);
  });
}

function debounce(callback, delay = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}





















