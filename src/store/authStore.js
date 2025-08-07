import { create } from 'zustand';
import apiService from '../services/api';

const useAuthStore = create((set, get) => ({
      // État d'authentification
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions d'authentification
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.login(credentials);
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true, user: response.data.user };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.register(userData);
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true, user: response.data.user };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          // Réinitialiser les données locales du gameStore pour éviter la persistance entre comptes
          const { resetUserData } = await import('../store/gameStore');
          if (resetUserData) {
            resetUserData();
          }
        }
      },

      // Vérifier l'authentification au démarrage
      checkAuth: async () => {
        if (!apiService.isAuthenticated()) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        
        try {
          const user = await apiService.getCurrentUser();
          
          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message,
          });
        }
      },

      // Mettre à jour le profil utilisateur
      updateUserProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.updateProfile(profileData);
          
          if (response.success) {
            set((state) => ({
              user: { ...state.user, ...response.data.user },
              isLoading: false,
              error: null,
            }));
            return { success: true };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Changer le mot de passe
      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.changePassword(passwordData);
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
            });
            return { success: true };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Upload d'avatar
      uploadAvatar: async (file) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.uploadAvatar(file);
          
          if (response.success) {
            set((state) => ({
              user: {
                ...state.user,
                profile: {
                  ...state.user.profile,
                  avatar: response.data.avatarUrl,
                },
              },
              isLoading: false,
              error: null,
            }));
            return { success: true, avatarUrl: response.data.avatarUrl };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Sélectionner une bannière
      selectBanner: async (bannerId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.updateProfile({ bannerId: bannerId });
          
          if (response.success) {
            set((state) => ({
              user: {
                ...state.user,
                profile: {
                  ...state.user.profile,
                  banner: bannerId,
                },
              },
              isLoading: false,
              error: null,
            }));
            return { success: true };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Sauvegarder le résultat d'une partie
      saveGameResult: async (gameData) => {
        if (!get().isAuthenticated) return { success: false, error: 'Non connecté' };
        
        try {
          const response = await apiService.saveGameResult(gameData);
          
          if (response.success) {
            // Récupérer les données utilisateur mises à jour depuis le serveur
            const updatedUser = await apiService.getCurrentUser();
            if (updatedUser) {
              set({ user: updatedUser });
            } else {
              // Fallback: mettre à jour seulement les statistiques
              set((state) => ({
                user: {
                  ...state.user,
                  gameStats: response.data.newStats,
                },
              }));
            }
            
            return { 
              success: true, 
              data: response.data,
              levelUp: response.data.levelUp,
              personalBest: response.data.personalBest,
            };
          }
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du résultat:', error);
          return { success: false, error: error.message };
        }
      },

      // Effacer les erreurs
      clearError: () => set({ error: null }),

      // Mettre à jour les données utilisateur localement
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData },
      })),
    }));

export default useAuthStore;
