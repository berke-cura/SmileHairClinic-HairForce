import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

interface SettingsState {
  language: string; // Kayıtlı dil kodu (örn: 'en', 'tr')
  _hasHydrated: boolean; // <-- 1. YENİ STATE'İ EKLE
  setLanguage: (language: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void; // <-- 2. YENİ EYLEMİ EKLE
}

// Cihazın varsayılan dilini al, desteklenmiyorsa 'en' kullan
const getDefaultLanguage = () => {
  const userLocale = Localization.getLocales()[0]?.languageCode || 'en';
  const supportedLocales = ['en', 'tr', 'de', 'ar', 'fr', 'it'];
  return supportedLocales.includes(userLocale) ? userLocale : 'en';
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: getDefaultLanguage(), // İlk açılışta cihaz dilini kaydet
      _hasHydrated: false, // <-- 3. BAŞLANGIÇ DEĞERİNİ EKLE
      setLanguage: (language) => set({ language }),
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'app-settings-storage', // AsyncStorage'deki key
      storage: createJSONStorage(() => AsyncStorage),
      // 4. VERİ YÜKLENDİĞİNDE BU FONKSİYONU ÇAĞIR:
      onRehydrateStorage: () => () => {
        useSettingsStore.getState().setHasHydrated(true);
      },
    }
  )
);

