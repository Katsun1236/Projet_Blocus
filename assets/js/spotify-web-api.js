/**
 * 🎵 Intégration Spotify Web API - Module Avancé
 * 
 * Ce module fournit une intégration complète avec Spotify via OAuth 2.0
 * Pour utiliser: Enregistrez une app sur https://developer.spotify.com/dashboard
 */

class SpotifyWebAPI {
    constructor(clientId, redirectUri) {
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.refreshToken = localStorage.getItem('spotify_refresh_token');
        this.expiresAt = parseInt(localStorage.getItem('spotify_expires_at') || '0');
    }
    
    /**
     * Initiér l'authentification Spotify OAuth 2.0
     */
    initiateAuth() {
        const scopes = [
            'streaming',
            'user-read-email',
            'user-read-private',
            'user-library-read',
            'user-top-read',
            'playlist-read-private',
            'playlist-read-collaborative'
        ];
        
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', this.clientId);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', this.redirectUri);
        authUrl.searchParams.append('scope', scopes.join(' '));
        authUrl.searchParams.append('state', this.generateRandomString(16));
        
        window.location.href = authUrl.toString();
    }
    
    /**
     * Traiter le code d'authentification retourné par Spotify
     */
    async handleAuthCallback(code) {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                    client_id: this.clientId
                    // NOTE: En production, le client_secret ne doit PAS être dans le JS frontend
                    // Utilisez un backend proxy au lieu de cela
                })
            });
            
            const data = await response.json();
            this.setTokens(data);
            return true;
        } catch (error) {
            console.error('❌ Erreur authentification Spotify:', error);
            return false;
        }
    }
    
    /**
     * Sauvegarder les tokens
     */
    setTokens(data) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.expiresAt = Date.now() + (data.expires_in * 1000);
        
        localStorage.setItem('spotify_access_token', this.accessToken);
        if (this.refreshToken) {
            localStorage.setItem('spotify_refresh_token', this.refreshToken);
        }
        localStorage.setItem('spotify_expires_at', this.expiresAt.toString());
    }
    
    /**
     * Renouveler le token d'accès
     */
    async refreshAccessToken() {
        if (!this.refreshToken) return false;
        
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                    client_id: this.clientId
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setTokens(data);
                return true;
            }
        } catch (error) {
            console.error('❌ Erreur renouvellement token:', error);
        }
        
        return false;
    }
    
    /**
     * Vérifier et renouveler le token si expiré
     */
    async ensureValidToken() {
        if (Date.now() >= this.expiresAt) {
            return await this.refreshAccessToken();
        }
        return !!this.accessToken;
    }
    
    /**
     * Rechercher des pistes
     */
    async searchTracks(query, limit = 10) {
        if (!await this.ensureValidToken()) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to search tracks');
        }
        
        const data = await response.json();
        return data.tracks.items;
    }
    
    /**
     * Obtenir les pistes sauvegardées de l'utilisateur
     */
    async getSavedTracks(limit = 20) {
        if (!await this.ensureValidToken()) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(
            `https://api.spotify.com/v1/me/tracks?limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get saved tracks');
        }
        
        const data = await response.json();
        return data.items.map(item => item.track);
    }
    
    /**
     * Obtenir les playlists de l'utilisateur
     */
    async getUserPlaylists(limit = 20) {
        if (!await this.ensureValidToken()) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(
            `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get playlists');
        }
        
        return await response.json();
    }
    
    /**
     * Obtenir les pistes d'une playlist
     */
    async getPlaylistTracks(playlistId, limit = 50) {
        if (!await this.ensureValidToken()) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get playlist tracks');
        }
        
        const data = await response.json();
        return data.items.map(item => item.track);
    }
    
    /**
     * Obtenir les artistes top de l'utilisateur
     */
    async getTopArtists(limit = 20, timeRange = 'medium_term') {
        if (!await this.ensureValidToken()) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(
            `https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${timeRange}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get top artists');
        }
        
        return await response.json();
    }
    
    /**
     * Obtenir les recommandations basées sur des artistes
     */
    async getRecommendations(artistIds, limit = 20) {
        if (!await this.ensureValidToken()) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(
            `https://api.spotify.com/v1/recommendations?seed_artists=${artistIds.join(',')}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to get recommendations');
        }
        
        const data = await response.json();
        return data.tracks;
    }
    
    /**
     * Générer une chaîne aléatoire pour PKCE
     */
    generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    
    /**
     * Vérifier si l'utilisateur est authentifié
     */
    isAuthenticated() {
        return !!this.accessToken && Date.now() < this.expiresAt;
    }
    
    /**
     * Déconnexion
     */
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = 0;
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_expires_at');
    }
}

// Export
window.SpotifyWebAPI = SpotifyWebAPI;
