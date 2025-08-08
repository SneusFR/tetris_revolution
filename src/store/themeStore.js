import { create } from 'zustand';
import useAuthStore from './authStore';
import apiService from '../services/api';

const useThemeStore = create((set, get) => ({
  // État local pour les thèmes récupérés du serveur
  themes: [],
  currentTheme: null,
  isLoading: false,
  error: null,

  // Récupérer les thèmes depuis le serveur
  fetchThemes: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getThemes();
      
      if (response.success) {
        // Ajouter les couleurs aux thèmes récupérés du serveur
        const themesWithColors = response.data.themes.map(theme => {
          // Définir les couleurs pour chaque thème
          const themeColors = {
            'neon': ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800', '#ff0044', '#8800ff'],
            'retro': ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c'],
            'galaxy': ['#9b59b6', '#3498db', '#e74c3c', '#f39c12', '#1abc9c', '#34495e', '#e67e22'],
            'cyberpunk': ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06ffa5', '#ff4365'],
            'pastel': ['#ffd3e1', '#c9f0ff', '#fff5ba', '#e4c1f9', '#a8e6cf', '#ffd3b6', '#ffaaa5'],
            'glassmorphism': ['rgba(255, 255, 255, 0.45)', 'rgba(255, 182, 193, 0.5)', 'rgba(173, 216, 230, 0.5)', 'rgba(255, 255, 224, 0.45)', 'rgba(221, 160, 221, 0.5)', 'rgba(152, 251, 152, 0.45)', 'rgba(255, 218, 185, 0.5)']
          };
          
          return {
            ...theme,
            colors: themeColors[theme.id] || themeColors['neon']
          };
        });
        
        // Trouver le thème actuellement sélectionné
        const currentThemeId = response.data.userStats?.currentTheme || 'neon';
        const currentThemeObj = themesWithColors.find(t => t.id === currentThemeId) || 
                               themesWithColors.find(t => t.id === 'neon') ||
                               themesWithColors[0];

        set({
          themes: themesWithColors,
          currentTheme: currentThemeObj,
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

        // AJOUT: Synchroniser le thème actuel avec le gameStore
        try {
          const { default: useGameStore } = await import('./gameStore');
          useGameStore.getState().setCurrentTheme(currentThemeId);
        } catch (error) {
          console.warn('Impossible de synchroniser le thème avec le gameStore:', error);
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

  // Acheter un thème
  purchaseTheme: async (themeId) => {
    const { themes } = get();
    const theme = themes.find(t => t.id === themeId);
    
    if (!theme) return { success: false, error: 'Thème non trouvé' };

    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Utilisateur non connecté' };

    if (theme.isOwned) {
      return { success: false, error: 'Thème déjà possédé' };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiService.purchaseTheme(themeId);
      
      if (response.success) {
        // Mettre à jour les crédits
        if (response.data?.remainingCredits !== undefined) {
          const updateUser = useAuthStore.getState().updateUser;
          updateUser({
            profile: {
              ...useAuthStore.getState().user?.profile,
              credits: response.data.remainingCredits
            }
          });
        }

        // Recharger les thèmes depuis le serveur SEULEMENT en cas de succès
        await get().fetchThemes();
        
        set({ isLoading: false });
        return { success: true, message: response.message };
      } else {
        // En cas d'échec, ne pas recharger pour éviter les boucles infinies
        set({ isLoading: false, error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      // En cas d'erreur, ne pas recharger pour éviter les boucles infinies
      console.error('Erreur lors de l\'achat de thème:', error);
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Sélectionner un thème
  selectTheme: async (themeId) => {
    const { themes } = get();
    const theme = themes.find(t => t.id === themeId);
    
    if (!theme || !theme.isOwned) {
      return { success: false, error: 'Thème non possédé' };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiService.updateSettings({ theme: themeId });
      
      if (response.success) {
        set({
          currentTheme: theme,
          isLoading: false,
          error: null
        });

        // Mettre à jour les données utilisateur
        const updateUser = useAuthStore.getState().updateUser;
        updateUser({
          settings: {
            ...useAuthStore.getState().user.settings,
            theme: themeId
          }
        });

        // AJOUT: Synchroniser avec le gameStore
        const { default: useGameStore } = await import('./gameStore');
        useGameStore.getState().setCurrentTheme(themeId);

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

  // Obtenir le thème actuel
  getCurrentTheme: () => {
    const { currentTheme } = get();
    return currentTheme || { 
      id: 'neon', 
      name: 'Neon', 
      colors: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800', '#ff0044', '#8800ff']
    };
  },

  // Effacer les erreurs
  clearError: () => set({ error: null })
}));

export default useThemeStore;
