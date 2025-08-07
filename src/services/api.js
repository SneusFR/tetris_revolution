const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('tetris_token');
    // Cache pour éviter les appels répétés
    this.cache = new Map();
    this.lastRequestTimes = new Map();
    // Délai minimum entre les requêtes (en ms)
    this.REQUEST_COOLDOWN = 1000; // 1 seconde
  }

  // Configuration des headers avec token
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Gestion des erreurs
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Une erreur est survenue');
    }
    
    return data;
  }

  // Authentification
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    
    const data = await this.handleResponse(response);
    
    if (data.success && data.data.token) {
      this.token = data.data.token;
      localStorage.setItem('tetris_token', this.token);
    }
    
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    
    const data = await this.handleResponse(response);
    
    if (data.success && data.data.token) {
      this.token = data.data.token;
      localStorage.setItem('tetris_token', this.token);
    }
    
    return data;
  }

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('tetris_token');
    }
  }

  async getCurrentUser() {
    if (!this.token) return null;
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response);
    return data.success ? data.data.user : null;
  }

  async changePassword(passwordData) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(passwordData),
    });
    
    return await this.handleResponse(response);
  }

  // Profil utilisateur
  async getUserProfile(username) {
    const response = await fetch(`${API_BASE_URL}/users/profile/${username}`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response);
    return data.success ? data.data.user : null;
  }

  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    
    return await this.handleResponse(response);
  }

  async updateSettings(settingsData) {
    const response = await fetch(`${API_BASE_URL}/users/settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settingsData),
    });
    
    return await this.handleResponse(response);
  }

  // Résultats de partie
  async saveGameResult(gameData) {
    const response = await fetch(`${API_BASE_URL}/users/game-result`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(gameData),
    });
    
    return await this.handleResponse(response);
  }

  async getGameHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/users/games?${queryString}`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response);
    return data.success ? data.data : null;
  }

  // Statistiques
  async getUserStats(username, period = 'all') {
    const response = await fetch(`${API_BASE_URL}/stats/user/${username}?period=${period}`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response);
    return data.success ? data.data : null;
  }

  async getGlobalStats(period = 'all') {
    const response = await fetch(`${API_BASE_URL}/stats/global?period=${period}`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response);
    return data.success ? data.data : null;
  }

  // Classements
  async getLeaderboard(type = 'global', params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/leaderboard/${type}?${queryString}`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response);
    return data.success ? data.data : null;
  }

  // Recherche d'utilisateurs
  async searchUsers(query, params = {}) {
    const queryString = new URLSearchParams({ q: query, ...params }).toString();
    const response = await fetch(`${API_BASE_URL}/users/search?${queryString}`, {
      headers: this.getHeaders(),
    });
    
    const data = await this.handleResponse(response);
    return data.success ? data.data : null;
  }

  // Upload de fichiers
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
    
    return await this.handleResponse(response);
  }

  async uploadBanner(file) {
    const formData = new FormData();
    formData.append('banner', file);
    
    const response = await fetch(`${API_BASE_URL}/upload/banner`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
    
    return await this.handleResponse(response);
  }

  // Boutique - Bannières
  async getBanners() {
    const response = await fetch(`${API_BASE_URL}/shop/banners`, {
      headers: this.getHeaders(),
    });
    
    return await this.handleResponse(response);
  }

  async purchaseBanner(bannerId) {
    const response = await fetch(`${API_BASE_URL}/shop/purchase-banner`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ bannerId }),
    });
    
    return await this.handleResponse(response);
  }

  async getBannerDetails(bannerId) {
    const response = await fetch(`${API_BASE_URL}/shop/banners/${bannerId}`, {
      headers: this.getHeaders(),
    });
    
    return await this.handleResponse(response);
  }

  // Boutique - Thèmes
  async getThemes() {
    const response = await fetch(`${API_BASE_URL}/shop/themes`, {
      headers: this.getHeaders(),
    });
    
    return await this.handleResponse(response);
  }

  async purchaseTheme(themeId) {
    const response = await fetch(`${API_BASE_URL}/shop/purchase-theme`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ themeId }),
    });
    
    return await this.handleResponse(response);
  }

  // Boutique - Effets
  async getEffects() {
    const cacheKey = 'shop/effects';
    const now = Date.now();
    
    // Vérifier si on a fait une requête récemment
    const lastRequestTime = this.lastRequestTimes.get(cacheKey);
    if (lastRequestTime && (now - lastRequestTime) < this.REQUEST_COOLDOWN) {
      console.log('Requête getEffects bloquée - trop récente');
      // Retourner les données du cache si disponibles
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      // Sinon, retourner une réponse d'erreur temporaire
      return { 
        success: false, 
        error: 'Requête trop fréquente, veuillez patienter' 
      };
    }
    
    try {
      // Enregistrer le temps de la requête
      this.lastRequestTimes.set(cacheKey, now);
      
      const response = await fetch(`${API_BASE_URL}/shop/effects`, {
        headers: this.getHeaders(),
      });
      
      const data = await this.handleResponse(response);
      
      // Mettre en cache la réponse si elle est réussie
      if (data.success) {
        this.cache.set(cacheKey, data);
        // Nettoyer le cache après 30 secondes
        setTimeout(() => {
          this.cache.delete(cacheKey);
        }, 30000);
      }
      
      return data;
    } catch (error) {
      // En cas d'erreur, ne pas bloquer les futures requêtes immédiatement
      // mais attendre un délai plus court
      setTimeout(() => {
        this.lastRequestTimes.delete(cacheKey);
      }, 5000); // 5 secondes au lieu de la cooldown complète
      
      throw error;
    }
  }

  async purchaseEffect(effectId) {
    const response = await fetch(`${API_BASE_URL}/shop/purchase-effect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ effectId }),
    });
    
    return await this.handleResponse(response);
  }

  // Nettoyer le cache et les protections (utile en cas de problème)
  clearCache() {
    this.cache.clear();
    this.lastRequestTimes.clear();
    console.log('Cache API nettoyé');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.token;
  }
}

export default new ApiService();
