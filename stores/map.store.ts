import { create } from 'zustand';

interface MapFilters {
  showDevices: boolean;
  showDisasters: boolean;
  showUsers: boolean;
  showShelters: boolean;
  showSOS: boolean;
}

interface MapState {
  center: [number, number];
  zoom: number;
  selectedDeviceId: string | null;
  filters: MapFilters;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedDeviceId: (id: string | null) => void;
  toggleFilter: (key: keyof MapFilters) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [27.7172, 85.324], // Kathmandu Valley Center
  zoom: 12,
  selectedDeviceId: null,
  filters: {
    showDevices: true,
    showDisasters: true,
    showUsers: true,
    showShelters: true,
    showSOS: true
  },
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
  toggleFilter: (key) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: !state.filters[key]
      }
    }))
}));
