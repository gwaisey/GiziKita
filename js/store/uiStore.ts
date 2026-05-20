import { create } from 'zustand';

interface UIState {
  toast: {
    message: string;
    visible: boolean;
  };
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toast: {
    message: '',
    visible: false,
  },
  showToast: (message: string) => {
    set({ toast: { message, visible: true } });
    // Auto hide after 3 seconds
    setTimeout(() => {
      set({ toast: { message: '', visible: false } });
    }, 3000);
  },
  hideToast: () => set({ toast: { message: '', visible: false } }),
}));
