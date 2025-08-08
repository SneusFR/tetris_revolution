import { create } from 'zustand';
import useAuthStore from './authStore';
import apiService from '../services/api';

const useBannerStore = create((set, get) => ({
  // État local pour les bannières récupérées du serveur
  banners: [],
  currentBanner: null,
  isLoading: false,
  error: null,

  // Récupérer les bannières depuis le serveur
  fetchBanners: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getBanners();
      
      if (response.success) {
        // Trouver la bannière actuellement sélectionnée
        const currentBannerId = response.data.userStats?.currentBanner || 'default';
        const currentBannerObj = response.data.banners.find(b => b.id === currentBannerId) || 
                                response.data.banners.find(b => b.id === 'default') ||
                                response.data.banners[0];

        set({
          banners: response.data.banners,
          currentBanner: currentBannerObj, // Stocker l'objet complet
          isLoading: false,
          error: null
        });

        // Synchroniser les crédits de l'utilisateur avec l'authStore
        if (response.data.userStats?.credits !== undefined) {
          const updateUser = useAuthStore.getState().updateUser;
          updateUser({
            profile: {
              ...useAuthStore.getState().user?.profile,
              credits: response.data.userStats.credits
            }
          });
        }
        return { success: true, data: response.data };
      } else {
        set({
          isLoading: false,
          error: response.message
        });
        return { success: false, error: response.message };
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  },

  // Obtenir les bannières avec leur statut de possession (depuis l'état local)
  getBannersWithOwnership: () => {
    return get().banners;
  },

  // Obtenir la bannière actuellement sélectionnée
  getCurrentBanner: () => {
    const { currentBanner } = get();
    return currentBanner || { 
      id: 'default', 
      name: 'Défaut', 
      type: 'gradient', 
      config: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } 
    };
  },

  // Obtenir une bannière par ID
  getBannerById: (bannerId) => {
    const { banners } = get();
    const found = banners.find(banner => banner.id === bannerId);
    
    if (found) {
      return found;
    }
    
    // Bannière par défaut si non trouvée
    const defaultBanner = { 
      id: 'default', 
      name: 'Défaut', 
      type: 'gradient', 
      config: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } 
    };
    
    // Si c'est tetris_classic et qu'on ne l'a pas trouvée, créer une version par défaut
    if (bannerId === 'tetris_classic') {
      return {
        id: 'tetris_classic',
        name: 'Tetris Classique',
        type: 'tetris',
        config: {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          pieces: ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
        }
      };
    }
    
    return defaultBanner;
  },

  // Vérifier si une bannière est possédée
  isBannerOwned: (bannerId) => {
    const { banners } = get();
    const banner = banners.find(b => b.id === bannerId);
    return banner ? banner.isOwned : false;
  },

  // Acheter une bannière (géré côté serveur)
  purchaseBanner: async (bannerId) => {
    const { banners } = get();
    const banner = banners.find(b => b.id === bannerId);
    
    if (!banner) return { success: false, error: 'Bannière non trouvée' };

    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Utilisateur non connecté' };

    // Vérifier si déjà possédée
    if (banner.isOwned) {
      return { success: false, error: 'Bannière déjà possédée' };
    }

    set({ isLoading: true, error: null });

    try {
      // Appel API pour acheter la bannière
      const response = await apiService.purchaseBanner(bannerId);
      
      if (response.success) {
        // Mettre à jour immédiatement les crédits avec les données retournées
        if (response.data?.remainingCredits !== undefined) {
          const updateUser = useAuthStore.getState().updateUser;
          updateUser({
            profile: {
              ...useAuthStore.getState().user?.profile,
              credits: response.data.remainingCredits
            }
          });
        }

        // Recharger les bannières depuis le serveur pour avoir les données à jour
        await get().fetchBanners();
        
        set({ isLoading: false });
        return { success: true, message: response.message };
      } else {
        set({ isLoading: false, error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Sélectionner une bannière (sera géré côté serveur)
  selectBanner: async (bannerId) => {
    const { banners } = get();
    const banner = banners.find(b => b.id === bannerId);
    
    if (!banner || !banner.isOwned) {
      return { success: false, error: 'Bannière non possédée' };
    }

    set({ isLoading: true, error: null });

    try {
      // Appel API pour sélectionner la bannière
      const response = await apiService.updateProfile({ bannerId: bannerId });
      
      if (response.success) {
        // Mettre à jour l'état local avec la bannière complète
        set({
          currentBanner: banner, // Utiliser l'objet bannière complet au lieu de juste l'ID
          isLoading: false,
          error: null
        });

        // Mettre à jour les données utilisateur
        const updateUser = useAuthStore.getState().updateUser;
        updateUser({
          profile: {
            ...useAuthStore.getState().user.profile,
            banner: bannerId
          }
        });

        return { success: true };
      } else {
        set({ isLoading: false, error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Synchroniser les données depuis le serveur
  syncUserData: async () => {
    return await get().fetchBanners();
  },

  // Effacer les erreurs
  clearError: () => set({ error: null })
}));

export default useBannerStore;
