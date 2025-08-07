// Configuration pour l'API et gestion des erreurs réseau
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  TIMEOUT: 10000, // 10 secondes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 seconde
};

// Fonction utilitaire pour faire des requêtes avec retry et timeout
export const fetchWithRetry = async (url, options = {}, retries = API_CONFIG.RETRY_ATTEMPTS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    // Si le serveur retourne 429 (Too Many Requests), attendre plus longtemps
    if (response.status === 429) {
      if (retries > 0) {
        console.warn(`Erreur 429 - Tentative ${API_CONFIG.RETRY_ATTEMPTS - retries + 1}/${API_CONFIG.RETRY_ATTEMPTS}`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * 2)); // Double délai pour 429
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error('Trop de requêtes - serveur surchargé');
    }
    
    // Si erreur réseau et qu'il reste des tentatives
    if (!response.ok && retries > 0 && response.status >= 500) {
      console.warn(`Erreur ${response.status} - Tentative ${API_CONFIG.RETRY_ATTEMPTS - retries + 1}/${API_CONFIG.RETRY_ATTEMPTS}`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Si c'est une erreur d'abort (timeout), ne pas retry
    if (error.name === 'AbortError') {
      throw new Error('Timeout - Le serveur met trop de temps à répondre');
    }
    
    // Si erreur réseau et qu'il reste des tentatives
    if (retries > 0) {
      console.warn(`Erreur réseau - Tentative ${API_CONFIG.RETRY_ATTEMPTS - retries + 1}/${API_CONFIG.RETRY_ATTEMPTS}:`, error.message);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
};

// Fonction pour vérifier si le serveur est accessible
export const checkServerHealth = async () => {
  try {
    const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
    }, 1); // Une seule tentative pour le health check
    
    return response.ok;
  } catch (error) {
    console.warn('Serveur non accessible:', error.message);
    return false;
  }
};
