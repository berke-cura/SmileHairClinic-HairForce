// src/stores/usePhotoHistoryStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pose } from '../types/pose';

// Cihazda saklanacak veri yapıları
export interface CapturedPhoto {
  uri: string;
  pose: Pose;
}

export interface PhotoSession {
  id: string; // Benzersiz ID, (örn: Date.now().toString())
  date: string; // ISO string formatında tarih
  photos: CapturedPhoto[];
}

interface PhotoHistoryState {
  sessions: PhotoSession[];
  loadSessions: () => void;
  addSession: (photos: CapturedPhoto[]) => void;
  hasHistory: () => boolean; // Ana sayfa mantığı için
}

export const usePhotoHistoryStore = create<PhotoHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      
      // Başlangıçta depolanan veriyi yükle (bu otomatik de tetiklenebilir)
      loadSessions: () => {
        // Zaten persist middleware tarafından yönetiliyor, 
        // ancak manuel çağırmak gerekirse burası doldurulabilir.
      },

      // Yeni bir fotoğraf oturumunu listeye ekle
      addSession: (photos) => {
        const newSession: PhotoSession = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          photos: photos,
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions], // Yeni oturumu başa ekle
        }));
      },
      
      // Hiç kayıtlı oturum var mı?
      hasHistory: () => get().sessions.length > 0,
    }),
    {
      name: 'photo-history-storage', // AsyncStorage'deki key
      storage: createJSONStorage(() => AsyncStorage), // AsyncStorage'ı depolama motoru yap
    }
  )
);

