import React, { useEffect, useState } from 'react'; // <-- useState'i import et
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native'; // <-- I18nManager'ı import et
import { useSettingsStore } from '@/src/stores/useSettingsStore'; // <-- Store'u import et
import i18n from '@/src/services/i18n'; // <-- i18n örneğini import et
import Colors from '@/src/constants/Colors';
import { t } from '@/src/services/i18n';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(app)',
};

export default function RootLayout() {
  // --- DİL AYARLAMA MANTIĞI (DÜZELTİLMİŞ) ---
  
  // 1. Store'dan SADECE '_hasHydrated' state'ini dinle.
  const hasHydrated = useSettingsStore((state) => state._hasHydrated);
  
  // 2. Dilin ayarlanıp ayarlanmadığını takip etmek için lokal bir state kullan.
  const [isI18nReady, setIsI18nReady] = useState(false);
  
  // --- DÜZELTME: DİLİ DİNLE ---
  // Bu satır, 'language' değiştiğinde tüm 'Stack'in yeniden
  // render olmasını ve 't()' fonksiyonunun yeni dili kullanmasını sağlar.
  const language = useSettingsStore((state) => state.language);
  // --- DÜZELTME SONU ---

  useEffect(() => {
    // Sadece store yüklendiğinde VE dil henüz ayarlanmadıysa çalış
    if (hasHydrated && !isI18nReady) {
      
      // 3. Dili hook ile değil, 'getState()' ile doğrudan oku
      const currentLanguage = useSettingsStore.getState().language;
      
      // 4. i18n kütüphanesini kayıtlı dille güncelle
      i18n.locale = currentLanguage;
      
      // 5. RTL'yi ayarla
      const isRTL = currentLanguage.startsWith('ar');
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
      
      // 6. Dil ayarının yapıldığını işaretle
      setIsI18nReady(true);
    }
  }, [hasHydrated, isI18nReady]); // <-- Bağımlılıklardan 'language' kaldırıldı

  // 7. Yükleme bitene kadar hiçbir şey gösterme
  // Bu, hem Zustand'ın yüklenmesini hem de i18n'in ayarlanmasını bekler.
  if (!isI18nReady) {
    return null; // Veya bir <LoadingSpinner />
  }
  // --- DİL AYARLAMA MANTIĞI SONU ---

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerBackTitleVisible: false, // Remove back button text, show only arrow icon
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
          headerTitleStyle: { color: Colors.light.text },
        }}
      >
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="camera" 
          options={{ 
            presentation: 'fullScreenModal', 
            headerShown: false,
            animation: 'slide_from_bottom'
          }} 
        />
        
        {/* --- YENİ MODALI EKLE --- */}
        <Stack.Screen 
          name="language-modal" 
          options={{ 
            presentation: 'modal', 
            headerShown: false
          }} 
        />
        {/* --- YENİ MODAL SONU --- */}
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
