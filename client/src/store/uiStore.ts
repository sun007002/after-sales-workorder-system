/**
 * UI state store using Zustand.
 * Manages sidebar collapse state and mobile drawer state.
 */
import { create } from 'zustand';

/** UI store state interface. */
interface UIState {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

/**
 * Zustand store for UI state (sidebar, drawer).
 */
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
  setMobileDrawerOpen: (open: boolean) => set({ mobileDrawerOpen: open }),
}));
