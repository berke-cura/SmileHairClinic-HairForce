// app/language-modal.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@/src/services/i18n';
import Colors from '@/src/constants/Colors';
import { ThemedCard } from '@/components/ThemedCard';
import { I18nManager } from 'react-native';
import i18n from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { ThemedButton } from '@/components/ThemedButton';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
];

export default function LanguageModal() {
  const router = useRouter();
  // 2. Aktif dili store'dan (veya i18n'den) al
  const currentLocale = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const changeLanguage = async (locale: string) => {
    if (currentLocale === locale) return; // Zaten bu dilde

    // 1. Kalıcı store'u güncelle
    setLanguage(locale); 

    // 2. Aktif çalışan i18n kütüphanesini güncelle
    i18n.locale = locale; 

    // 3. RTL ayarlarını yap (bir sonraki açılış için)
    const isRTL = locale.startsWith('ar');
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);

    // 4. UYARI (ALERT) BLOĞU TAMAMEN SİLİNDİ
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('language.selectLanguage')}</Text>
      </View>
      
      {languages.map((lang) => (
        <Pressable key={lang.code} onPress={() => changeLanguage(lang.code)}>
          <ThemedCard style={[
            styles.card,
            currentLocale === lang.code && styles.activeCard
          ]}>
            <Text style={[
              styles.langText,
              currentLocale === lang.code && styles.activeText,
              // Arapça için sağa hizala
              lang.code === 'ar' && { textAlign: 'right' } 
            ]}>
              {lang.name}
            </Text>
          </ThemedCard>
        </Pressable>
      ))}

      <ThemedButton
        title={t('common.close')}
        variant="outline"
        onPress={() => router.back()}
        style={{ margin: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background, 
    justifyContent: 'center' 
  },
  header: { padding: 20, marginBottom: 10 },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: Colors.light.text, 
    textAlign: 'center' 
  },
  card: { marginHorizontal: 20, marginBottom: 12, padding: 20 },
  activeCard: {
    backgroundColor: Colors.light.accent,
    borderColor: Colors.light.accent,
  },
  langText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.light.text 
  },
  activeText: {
    color: Colors.light.textLight,
  },
});

