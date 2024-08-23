const apiKey = 'f1dd7f2494de60ef4946ea81fd5ebaba';
const movieList = document.getElementById('movie-list');
const searchInput = document.getElementById('search-input');
const movieDetails = document.getElementById('movie-details');
const backBtn = document.getElementById('back-btn');

let currentMovieIndex = 0;
let currentContentType = 'movie';
let movies = [];
let searchTimeout;
let watchlistActive = false;


// fetch movies
function fetchMovies() {
    fetch(`https://api.themoviedb.org/3/discover/${currentContentType}?api_key=${apiKey}&page=${Math.floor(currentMovieIndex / 20) + 1}`)
        .then(response => response.json())
        .then(data => {
            displayMovies(data.results);
            currentMovieIndex += 20;
        })
        .catch(error => console.error('Error fetching movies:', error));
}

function displayMovies(movies) {
    movies.forEach((movie, index) => {
        // stop duplicate movies
        if (document.getElementById(`movie-${movie.id}`)) {
            return;
        }

        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.id = `movie-${movie.id}`; // id to check duplicates

        if (movie.poster_path === null) {
            var src = '/assets/tmdb_placeholder_400x600.png'
        } else {
            var src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        }
        movieCard.innerHTML = `
            <img src="${src}" alt="${movie.title || movie.name}">
        `;
        movieCard.addEventListener('click', () => showMovieDetails(movie.id));
        movieList.appendChild(movieCard);

        setTimeout(() => {
            movieCard.style.opacity = '1';
        }, index * 100);
    });
}

// Function to show a notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300); // rmove after fade out
    }, 2000);
}


function updateWatchlistButton(button, inWatchlist) {
    if (inWatchlist) {
        button.innerHTML = '<i class="fas fa-minus"></i> Remove from Watchlist';
        button.onclick = () => removeFromWatchlist(button.dataset.id, button.dataset.type);
    } else {
        button.innerHTML = '<i class="fas fa-plus"></i> Add to Watchlist';
        button.onclick = () => addToWatchlist(button.dataset.id, button.dataset.type);
    }
}
function closeFullscreenIframe() {
    const baButon = document.getElementById('back-btn-iframe');
    baButon.style.display = 'block';
    const fullscreenIframe = document.getElementById('fullscreen-iframe');
    fullscreenIframe.classList.remove('show-iframe');
    fullscreenIframe.src = '';
    document.body.style.overflow = 'auto'; // re-enable scrolling on body
}


function addToWatchlist(tmdbId, type) {
    const watchlistKey = type === 'movie' ? 'movieWatchlist' : 'tvWatchlist';
    const watchlist = JSON.parse(localStorage.getItem(watchlistKey)) || [];

    if (!watchlist.includes(tmdbId)) {
        watchlist.push(tmdbId);
        localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
        showNotification('Added to watchlist');

        const button = document.querySelector(`.watchlist-btn[data-id="${tmdbId}"]`);
        updateWatchlistButton(button, true);
    }
}


function removeFromWatchlist(tmdbId, type) {
    const watchlistKey = type === 'movie' ? 'movieWatchlist' : 'tvWatchlist';
    let watchlist = JSON.parse(localStorage.getItem(watchlistKey)) || [];

    watchlist = watchlist.filter(id => id !== tmdbId);
    localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
    showNotification('Removed from watchlist');

    const button = document.querySelector(`.watchlist-btn[data-id="${tmdbId}"]`);
    updateWatchlistButton(button, false);
}


function loadWatchlist(type) {
    let movieWatchlist = [];
    let tvWatchlist = [];
    watchlistActive = true;
    if (type === 'both') {
        movieWatchlist = JSON.parse(localStorage.getItem('movieWatchlist')) || [];
        tvWatchlist = JSON.parse(localStorage.getItem('tvWatchlist')) || [];
    } else if (type === 'movie') {
        movieWatchlist = JSON.parse(localStorage.getItem('movieWatchlist')) || [];
    } else if (type === 'tv') {
        tvWatchlist = JSON.parse(localStorage.getItem('tvWatchlist')) || [];
    } else {
        console.error('Invalid type:', type);
        return;
    }

    const watchlist = [...movieWatchlist, ...tvWatchlist];

    if (watchlist.length > 0) {
        const promises = watchlist.map(id => {
            if (movieWatchlist.includes(id)) {
                return fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`);
            } else if (tvWatchlist.includes(id)) {
                return fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`);
            }
        });

        Promise.all(promises)
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(data => {
                movieList.innerHTML = '';
                displayMovies(data);
            })
            .catch(error => console.error('Error fetching watchlist items:', error));
    } else {
        movieList.innerHTML = '<p>Your watchlist is empty.</p>';
    }
}
let currentSeason = 1; // default season and ep 1
let currentEpisode = 1;

function showMovieDetails(movieId) {
    fetch(`https://api.themoviedb.org/3/${currentContentType}/${movieId}?api_key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            movieList.style.display = 'none';
            movieDetails.style.display = window.innerWidth < 768 ? 'block' : 'flex';
            let season_add;
            backBtn.style.display = 'block';
            if (currentContentType === "tv") {
                season_add = `<div class="season-container">
                        <label for="season-select">Select Season:</label>
                        <select id="season-select" onchange="fetchEpisodes(${data.id})"></select>
                    </div>                    <div class="episodes-container" id="episodes-container"></div>
`
            } else {
                season_add = ``
            }
            movieDetails.innerHTML = `
                <button class="back-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i></button>
                <img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="${data.title || data.name}">
                <div class="info">
                    <h2>${data.title || data.name}</h2>
                    <p>${data.overview}</p>
                    <p><strong>Release Date:</strong> ${data.release_date || data.first_air_date}</p>
                    <p><strong>Rating:</strong> ${data.vote_average}</p>
                    <div class="buttons-container">
                        <button class="watch-now-btn" onclick="openFullscreenIframe()"><i class="fas fa-play"></i>Watch Now</button>
                        <button class="watchlist-btn" data-id="${data.id}" data-type="${currentContentType}">
                            <i class="fas fa-plus"></i>Add to Watchlist</button>
                    </div>
                    ${season_add}
                </div>
                <iframe id="fullscreen-iframe" class="fullscreen-iframe" frameborder="0" allowfullscreen></iframe>
                <button class="back-btn-iframe" id="back-btn-iframe" onclick="closeFullscreenIframe()"><i class="fas fa-arrow-left"></i></button>
            `;

            if (currentContentType === 'tv') {
                fetchSeasons(data.id);
            }

            const fullscreenIframe = document.getElementById('fullscreen-iframe');
            openFullscreenIframe = () => {
                const baButton = document.getElementById('back-btn-iframe');
                baButton.style.display = 'block';
                let url;
                if (currentContentType === 'movie') {
                    url = `https://vidsrc.rip/embed/movie/${data.id}`;
                } else if (currentContentType === 'tv') {
                    url = `https://vidsrc.rip/embed/tv/${data.id}/${currentSeason}/${currentEpisode}`;
                }
                fullscreenIframe.src = url;
                fullscreenIframe.classList.add('show-iframe');
                document.body.style.overflow = 'hidden'; // disable scrolling on body
            };

            const watchlistKey = currentContentType === 'movie' ? 'movieWatchlist' : 'tvWatchlist';
            const watchlist = JSON.parse(localStorage.getItem(watchlistKey)) || [];
            const inWatchlist = watchlist.includes(String(data.id));
            const button = document.querySelector(`.watchlist-btn[data-id="${data.id}"]`);
            updateWatchlistButton(button, inWatchlist);
        })
        .catch(error => console.error('Error fetching movie details:', error));
}

function fetchSeasons(tvId) {
    fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            const seasonSelect = document.getElementById('season-select');
            seasonSelect.innerHTML = '';
            data.seasons.forEach(season => {
                if (season.season_number > 0) { // skip season 0, aka specials
                    const option = document.createElement('option');
                    option.value = season.season_number;
                    option.textContent = `Season ${season.season_number}`;
                    seasonSelect.appendChild(option);
                }
            });
            fetchEpisodes(tvId, 1);
        })
        .catch(error => console.error('Error fetching seasons:', error));
}

function fetchEpisodes(tvId, seasonNumber) {
    const seasonSelect = document.getElementById('season-select');
    const selectedSeason = seasonNumber || seasonSelect.value;
    currentSeason = selectedSeason;

    fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${selectedSeason}?api_key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            const episodesContainer = document.getElementById('episodes-container');
            episodesContainer.innerHTML = '';
            const defaultImage = 'assets/default_image.jpg'; // placeholder image havent found yet ;(
            const backgroundImage = `https://image.tmdb.org/t/p/w500${data.poster_path}`; // TV show background image

            data.episodes.forEach((episode, index) => {
                const episodeDiv = document.createElement('div');
                episodeDiv.classList.add('episode');
                const episodeImage = episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : backgroundImage;

                episodeDiv.innerHTML = `
                    <img src="${episodeImage}" alt="${episode.name}" onerror="this.onerror=null;this.src='${defaultImage}';">
                    <p>${episode.name}</p>
                `;

                episodeDiv.addEventListener('click', () => {
                    currentEpisode = episode.episode_number;
                    document.querySelectorAll('.episode').forEach(ep => ep.classList.remove('selected'));
                    episodeDiv.classList.add('selected');
                });

                episodesContainer.appendChild(episodeDiv);
            });

            currentEpisode = 1;
            if (episodesContainer.firstChild) {
                episodesContainer.firstChild.classList.add('selected');
            }
        })
        .catch(error => console.error('Error fetching episodes:', error));
}

function goBack() {
    movieDetails.style.display = 'none';
    movieList.style.display = 'flex';
    backBtn.style.display = 'none';
    watchlistActive = false;

}

function loadMovies() {
    currentContentType = 'movie';
    currentMovieIndex = 0;
    movies = [];
    movieList.innerHTML = '';
    fetchMovies();
    movieList.style.display = 'flex';
    movieDetails.style.display = 'none';
    backBtn.style.display = 'none';
    watchlistActive = false;

}

function loadTVShows() {
    currentContentType = 'tv';
    currentMovieIndex = 0;
    movies = [];
    movieList.innerHTML = '';
    fetchMovies();
    movieList.style.display = 'flex';
    movieDetails.style.display = 'none';
    backBtn.style.display = 'none';
    watchlistActive = false;

}

function toggleSearch() {
    currentMovieIndex = 0;
    movies = [];
    movieList.innerHTML = '';
    const searchContainer = document.getElementById('search-container');
    searchContainer.style.display = `flex`;
    watchlistActive = false;

}

function searchMovies() {
    const query = searchInput.value.trim();
    if (query) {
        fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${query}`)
            .then(response => response.json())
            .then(data => {
                movieList.innerHTML = '';
                displayMovies(data.results);
            })
            .catch(error => console.error('Error searching movies:', error));
    }
}

function liveSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchMovies, 500);
}



window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && movieList.style.display !== 'none' && watchlistActive === false) {
        fetchMovies();
    }
});

fetchMovies();
backBtn.style.display = 'none';
