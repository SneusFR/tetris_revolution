import { create } from 'zustand';
import useAuthStore from './authStore';
import apiService from '../services/api';

const useEffectStore = create((set, get) => ({
  // État local pour les effets récupérés du serveur
  effects: [],
  currentEffect: null,
  isLoading: false,
  error: null,

  // Récupérer les effets depuis le serveur
  fetchEffects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getEffects();
      
      if (response.success) {
        // Trouver l'effet actuellement sélectionné
        const currentEffectId = response.data.userStats?.currentEffect || 'none';
        const currentEffectObj = response.data.effects.find(e => e.id === currentEffectId) || 
                                response.data.effects.find(e => e.id === 'none') ||
                                response.data.effects[0];

        set({
          effects: response.data.effects,
          currentEffect: currentEffectObj,
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

  // Acheter un effet
  purchaseEffect: async (effectId) => {
    const { effects } = get();
    const effect = effects.find(e => e.id === effectId);
    
    if (!effect) return { success: false, error: 'Effet non trouvé' };

    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Utilisateur non connecté' };

    if (effect.isOwned) {
      return { success: false, error: 'Effet déjà possédé' };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiService.purchaseEffect(effectId);
      
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

        // Recharger les effets depuis le serveur
        await get().fetchEffects();
        
        set({ isLoading: false });
        return { success: true, message: response.message };
      } else {
        // CORRECTION: Recharger les données même en cas d'échec pour synchroniser
        await get().fetchEffects();
        set({ isLoading: false, error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      // CORRECTION: Recharger les données même en cas d'erreur pour synchroniser
      await get().fetchEffects();
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Sélectionner un effet
  selectEffect: async (effectId) => {
    const { effects } = get();
    const effect = effects.find(e => e.id === effectId);
    
    if (!effect || !effect.isOwned) {
      return { success: false, error: 'Effet non possédé' };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiService.updateSettings({ visualEffect: effectId });
      
      if (response.success) {
        set({
          currentEffect: effect,
          isLoading: false,
          error: null
        });

        // Mettre à jour les données utilisateur
        const updateUser = useAuthStore.getState().updateUser;
        updateUser({
          settings: {
            ...useAuthStore.getState().user.settings,
            visualEffect: effectId
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

  // Obtenir l'effet actuel
  getCurrentEffect: () => {
    const { currentEffect } = get();
    return currentEffect || { 
      id: 'none', 
      name: 'Aucun'
    };
  },

  // Effacer les erreurs
  clearError: () => set({ error: null })
}));

export default useEffectStore;
