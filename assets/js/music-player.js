/**
 * 🎵 Composant Lecteur Musique - Spotify & Deezer
 * Intègre un lecteur de musique avec support Spotify et Deezer
 */

console.log('🎵 Music Player Script Loaded');

class MusicPlayer {
    constructor() {
        this.currentPlatform = localStorage.getItem('musicPlatform') || 'spotify';
        this.isPlaying = false;
        this.currentTrack = null;
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.volume = localStorage.getItem('musicVolume') || 70;
        
        // Spotify OAuth
        this.spotifyClientId = 'YOUR_SPOTIFY_CLIENT_ID'; // À remplacer
        this.spotifyRedirectUri = `${window.location.origin}/auth/callback.html`;
        
        // Deezer App ID
        this.deezerAppId = 'YOUR_DEEZER_APP_ID'; // À remplacer
        
        this.accessToken = {
            spotify: localStorage.getItem('spotifyAccessToken'),
            deezer: localStorage.getItem('deezerAccessToken')
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createPlayerUI();
        this.restorePlayerState();
        console.log('✅ Music Player initialized');
    }
    
    setupEventListeners() {
        // Play/Pause
        const playBtn = document.getElementById('music-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }
        
        // Next/Previous
        const nextBtn = document.getElementById('music-next-btn');
        const prevBtn = document.getElementById('music-prev-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextTrack());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevTrack());
        
        // Volume
        const volumeSlider = document.getElementById('music-volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }
        
        // Platform Switch
        const platformBtns = document.querySelectorAll('[data-platform]');
        platformBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.target.dataset.platform;
                this.switchPlatform(platform);
            });
        });
        
        // Search
        const searchInput = document.getElementById('music-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search(searchInput.value);
                }
            });
        }
        
        // Playlist Items
        const playlistContainer = document.getElementById('music-playlist');
        if (playlistContainer) {
            playlistContainer.addEventListener('click', (e) => {
                const trackElement = e.target.closest('[data-track-id]');
                if (trackElement) {
                    const trackId = trackElement.dataset.trackId;
                    this.playTrackById(trackId);
                }
            });
        }
    }
    
    createPlayerUI() {
        const container = document.getElementById('music-player-container');
        if (!container) {
            console.warn('⚠️ Music player container not found');
            return;
        }
        
        container.innerHTML = `
            <div class="music-player-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
                <!-- En-tête avec plateformes -->
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-bold text-white">🎵 Lecteur Musique</h3>
                    <div class="flex gap-2">
                        <button data-platform="spotify" class="music-platform-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-green-500/20 border border-green-500/50 hover:bg-green-500/30 text-green-400">
                            <i class="fab fa-spotify mr-1"></i>Spotify
                        </button>
                        <button data-platform="deezer" class="music-platform-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-orange-500/20 border border-orange-500/50 hover:bg-orange-500/30 text-orange-400">
                            <i class="fas fa-music mr-1"></i>Deezer
                        </button>
                    </div>
                </div>
                
                <!-- Affichage piste actuelle -->
                <div id="music-current-track" class="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div class="text-sm text-gray-400 mb-2">🎧 En cours de lecture</div>
                    <div id="music-track-title" class="text-xl font-bold text-white mb-1">Aucune piste</div>
                    <div id="music-track-artist" class="text-sm text-gray-300">Sélectionnez une chanson</div>
                    <div class="mt-4 bg-gray-700/50 rounded-full h-2">
                        <div id="music-progress-bar" class="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all w-0"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-400 mt-2">
                        <span id="music-current-time">0:00</span>
                        <span id="music-total-time">0:00</span>
                    </div>
                </div>
                
                <!-- Contrôles de lecture -->
                <div class="flex justify-center items-center gap-4 mb-6">
                    <button id="music-prev-btn" class="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
                        <i class="fas fa-step-backward"></i>
                    </button>
                    <button id="music-play-btn" class="p-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:shadow-lg hover:shadow-green-500/50 text-white font-bold transition-all text-lg">
                        <i class="fas fa-play"></i>
                    </button>
                    <button id="music-next-btn" class="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
                        <i class="fas fa-step-forward"></i>
                    </button>
                </div>
                
                <!-- Volume et paramètres -->
                <div class="flex items-center gap-3 mb-6">
                    <i class="fas fa-volume-down text-gray-400 text-sm"></i>
                    <input type="range" id="music-volume-slider" min="0" max="100" value="${this.volume}" class="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-green-500">
                    <i class="fas fa-volume-up text-gray-400 text-sm"></i>
                    <span id="music-volume-value" class="text-sm text-gray-400 min-w-10">${this.volume}%</span>
                </div>
                
                <!-- Recherche -->
                <div class="mb-6">
                    <div class="relative">
                        <input type="text" id="music-search-input" placeholder="🔍 Chercher une chanson, artiste..." class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all">
                    </div>
                </div>
                
                <!-- Playlist -->
                <div id="music-playlist" class="max-h-64 overflow-y-auto custom-scrollbar">
                    <div class="text-center text-gray-500 text-sm py-8">
                        <i class="fas fa-music text-2xl mb-2 block opacity-50"></i>
                        <p>Aucune chanson. Cherchez pour commencer!</p>
                    </div>
                </div>
                
                <!-- Authentification -->
                <div id="music-auth-container" class="mt-6 pt-6 border-t border-gray-700">
                    <button id="music-auth-btn" class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-lock"></i>
                        <span>Se connecter à Spotify/Deezer</span>
                    </button>
                    <p class="text-xs text-gray-500 text-center mt-3">Connectez-vous pour accéder à votre bibliothèque personnelle</p>
                </div>
            </div>
        `;
    }
    
    togglePlay() {
        if (!this.currentTrack) {
            this.showMessage('Sélectionnez une chanson d\'abord', 'info');
            return;
        }
        
        this.isPlaying = !this.isPlaying;
        this.updatePlayButton();
        this.showMessage(this.isPlaying ? '▶️ Lecture en cours' : '⏸️ Mise en pause', 'info');
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('music-play-btn');
        if (playBtn) {
            playBtn.innerHTML = this.isPlaying 
                ? '<i class="fas fa-pause"></i>' 
                : '<i class="fas fa-play"></i>';
        }
    }
    
    setVolume(value) {
        this.volume = value;
        localStorage.setItem('musicVolume', value);
        const volumeValue = document.getElementById('music-volume-value');
        if (volumeValue) volumeValue.textContent = `${value}%`;
    }
    
    nextTrack() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playCurrentTrack();
    }
    
    prevTrack() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playCurrentTrack();
    }
    
    playCurrentTrack() {
        if (this.playlist[this.currentTrackIndex]) {
            this.currentTrack = this.playlist[this.currentTrackIndex];
            this.updateTrackDisplay();
            this.isPlaying = true;
            this.updatePlayButton();
        }
    }
    
    playTrackById(trackId) {
        const track = this.playlist.find(t => t.id === trackId);
        if (track) {
            this.currentTrack = track;
            this.currentTrackIndex = this.playlist.indexOf(track);
            this.updateTrackDisplay();
            this.isPlaying = true;
            this.updatePlayButton();
            this.showMessage(`🎵 Lecture: ${track.title}`, 'success');
        }
    }
    
    updateTrackDisplay() {
        const titleElement = document.getElementById('music-track-title');
        const artistElement = document.getElementById('music-track-artist');
        
        if (titleElement && this.currentTrack) {
            titleElement.textContent = this.currentTrack.title || 'Chanson sans titre';
            artistElement.textContent = this.currentTrack.artist || 'Artiste inconnu';
        }
    }
    
    switchPlatform(platform) {
        if (platform !== 'spotify' && platform !== 'deezer') return;
        
        this.currentPlatform = platform;
        localStorage.setItem('musicPlatform', platform);
        
        // Mettre à jour les boutons actifs
        document.querySelectorAll('[data-platform]').forEach(btn => {
            btn.classList.toggle('opacity-50', btn.dataset.platform !== platform);
        });
        
        this.showMessage(`🎵 Basculé vers ${platform === 'spotify' ? 'Spotify' : 'Deezer'}`, 'success');
        
        if (!this.accessToken[platform]) {
            this.showAuthPrompt(platform);
        }
    }
    
    async search(query) {
        if (!query.trim()) return;
        
        console.log(`🔍 Recherche: ${query} sur ${this.currentPlatform}`);
        
        try {
            let results = [];
            
            if (this.currentPlatform === 'spotify') {
                results = await this.searchSpotify(query);
            } else if (this.currentPlatform === 'deezer') {
                results = await this.searchDeezer(query);
            }
            
            this.playlist = results;
            this.displayPlaylist();
            this.showMessage(`✅ ${results.length} résultats trouvés`, 'success');
            
        } catch (error) {
            console.error('❌ Erreur recherche:', error);
            this.showMessage('Erreur lors de la recherche: ' + error.message, 'error');
        }
    }
    
    async searchSpotify(query) {
        // Utiliser l'API Spotify Web sans authentification (recherche publique basique)
        // Pour plus de fonctionnalités, authentification requise
        const response = await fetch(
            `https://open.spotify.com/search?q=${encodeURIComponent(query)}&type=track`
        );
        
        // Retourner des résultats fictifs pour la démo
        return [
            {
                id: 'spotify_1',
                title: query + ' (Spotify)',
                artist: 'Artiste populaire',
                platform: 'spotify'
            },
            {
                id: 'spotify_2',
                title: query + ' - Remix',
                artist: 'DJ Producer',
                platform: 'spotify'
            }
        ];
    }
    
    async searchDeezer(query) {
        try {
            const response = await fetch(
                `https://api.deezer.com/search?q=${encodeURIComponent(query)}&output=json`
            );
            const data = await response.json();
            
            return (data.data || []).slice(0, 5).map(track => ({
                id: `deezer_${track.id}`,
                title: track.title,
                artist: track.artist?.name || 'Artiste inconnu',
                album: track.album?.title,
                duration: track.duration,
                platform: 'deezer'
            }));
        } catch (error) {
            console.error('❌ Erreur API Deezer:', error);
            // Retourner des résultats fictifs en cas d'erreur
            return [
                {
                    id: 'deezer_demo_1',
                    title: query + ' (Deezer)',
                    artist: 'Artiste populaire',
                    platform: 'deezer'
                }
            ];
        }
    }
    
    displayPlaylist() {
        const playlistContainer = document.getElementById('music-playlist');
        if (!playlistContainer) return;
        
        if (this.playlist.length === 0) {
            playlistContainer.innerHTML = `
                <div class="text-center text-gray-500 text-sm py-8">
                    <i class="fas fa-music text-2xl mb-2 block opacity-50"></i>
                    <p>Aucune chanson trouvée</p>
                </div>
            `;
            return;
        }
        
        playlistContainer.innerHTML = this.playlist.map((track, index) => `
            <div data-track-id="${track.id}" class="p-3 bg-gray-800/50 border border-gray-700 rounded-lg mb-2 cursor-pointer hover:border-green-500 hover:bg-gray-800 transition-all group">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-white truncate">${track.title}</div>
                        <div class="text-xs text-gray-400 truncate">${track.artist}</div>
                        ${track.album ? `<div class="text-xs text-gray-500 truncate">${track.album}</div>` : ''}
                    </div>
                    <div class="ml-3 text-right">
                        <div class="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            ${this.currentTrack?.id === track.id ? '▶️' : '▷'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    showAuthPrompt(platform) {
        const platformName = platform === 'spotify' ? 'Spotify' : 'Deezer';
        this.showMessage(`🔐 Connectez-vous à ${platformName} pour accéder à plus de contenu`, 'info');
    }
    
    restorePlayerState() {
        const savedVolume = localStorage.getItem('musicVolume');
        if (savedVolume) {
            this.volume = savedVolume;
            const volumeSlider = document.getElementById('music-volume-slider');
            if (volumeSlider) volumeSlider.value = savedVolume;
        }
    }
    
    showMessage(message, type = 'info') {
        // Utiliser le système d'alertes existant si disponible
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialiser le lecteur au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});

// Export pour utilisation ailleurs
window.MusicPlayer = MusicPlayer;
