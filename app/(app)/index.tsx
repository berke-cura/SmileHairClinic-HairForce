import { ThemedCard } from '@/components/ThemedCard';
import Colors from '@/src/constants/Colors';
import { t } from '@/src/services/i18n';
import { usePoseCameraStore } from '@/src/stores/poseCameraStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

// --- A. handleStartSession'ı veri dizisinden ÖNCE tanımla ---
const handleStartSession = (router: any) => {
  usePoseCameraStore.getState().resetSequence();
  router.push('/camera');
};

// --- B. IconGridButton'ı hem "href" hem "onPress" kabul edecek şekilde güncelle ---
// Bu bileşen artık "aptal" (dumb), sadece prop'larını alır.
// useSettingsStore hook'una artık ihtiyaç yok çünkü useMemo ile data referansı değişiyor.
const IconGridButton: React.FC<{ item: any }> = ({ item }) => {
  const cardContent = (
    <ThemedCard style={styles.gridCard}>
      <Ionicons name={item.icon as any} size={32} color={Colors.light.text} />
      {/* 't' fonksiyonu en son 'i18n.locale' neyse onu kullanır */}
      <Text style={styles.gridCardText}>{t(item.titleKey)}</Text>
    </ThemedCard>
  );

  // Eğer 'href' varsa Link kullan, yoksa 'onPress' ile Pressable kullan
  if (item.href) {
    return (
      <Link href={item.href as any} asChild style={styles.gridButtonWrapper}>
        <Pressable>{cardContent}</Pressable>
      </Link>
    );
  }

  return (
    <Pressable onPress={item.onPress} style={styles.gridButtonWrapper}>
      {cardContent}
    </Pressable>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  
  // --- DİL DEĞİŞİKLİĞİNİ DİNLE ---
  // Bu, 'useMemo' hook'unu yeniden tetiklemek için KRİTİKTİR.
  const language = useSettingsStore((state) => state.language);

  // --- VERİYİ 'useMemo' İÇİNE TAŞI ---
  // 'language' her değiştiğinde, bu fonksiyon yeniden çalışır
  // ve 'gridData' için YENİ BİR dizi referansı oluşturur.
  const gridData = useMemo(() => {
    return [
      { 
        id: 'startSession', 
        titleKey: 'home.newSession', 
        icon: 'camera-outline',
        onPress: () => handleStartSession(router)
      },
      { 
        id: 'history', 
        titleKey: 'home.myHistory', 
        icon: 'albums-outline',
        href: '/(app)/history'
      },
      { id: 'doctors', titleKey: 'home.doctors', icon: 'medical-outline', href: '/(app)/doctors' },
      { id: 'beforeAfter', titleKey: 'home.beforeAfter', icon: 'images-outline', href: '/(app)/before-after' },
      { id: 'patientGuide', titleKey: 'home.patientGuide', icon: 'book-outline', href: '/(app)/patient-guide' },
      { id: 'faq', titleKey: 'home.faq', icon: 'help-circle-outline', href: '/(app)/faq' },
      { id: 'transportation', titleKey: 'home.transportation', icon: 'map-outline', href: '/(app)/transportation' },
      { id: 'contact', titleKey: 'home.contact', icon: 'call-outline', href: '/(app)/contact' },
    ];
  }, [language, router]); // <-- 'language' ve 'router'a bağlı

  return (
    <View style={styles.container}> 
      <Stack.Screen options={{ title: t('navigation.home'), headerShown: false }} />
      
      {/* --- YENİ GLOBE (DİL) BUTONUNU EKLE --- */}
      <Link href="/language-modal" asChild>
        <Pressable style={styles.globeButton}>
          <Ionicons name="globe-outline" size={24} color={Colors.light.text} />
        </Pressable>
      </Link>
      
      {/* 1. Header (Sadece Logo) */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        {/* <Text style={styles.title}>{title}</Text> <-- BAŞLIK SİLİNDİ */}
      </View>

      {/* 2. Grid Menü (8'li) */}
      <View style={styles.exploreSection}>
        {/* --- DÜZELTME: 'language' state'ini 'key' prop'una atayarak --- */}
        {/* dil değiştiğinde FlatList'in tamamen yeniden çizilmesini zorla. */}
        <View key={language}>
          <FlatList
            data={gridData} // <-- 'useMemo'dan gelen YENİ referansı kullan
            keyExtractor={(item) => item.id}
            numColumns={2} 
            renderItem={({ item }) => <IconGridButton item={item} />}
            scrollEnabled={false} 
            columnWrapperStyle={styles.gridRow}
          />
        </View>
        {/* --- DÜZELTME SONU --- */}
      </View>
    </View>
  );
}

// --- 3. STİLLERİ GÜNCELLE ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background, 
    justifyContent: 'center', // Öğeleri dikeyde ortala
    paddingTop: 40, 
  },
  // --- YENİ GLOBE STİLİ ---
  globeButton: {
    position: 'absolute',
    top: 60, // iOS için (Safe Area'yı dikkate al)
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.3)', // Transparan Gri
    width: 44,
    height: 44,
    borderRadius: 22, // Yuvarlak
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center', 
    // Logo ve grid arasında boşluk için 'flex' yerine 'paddingBottom' kullanalım
    paddingBottom: 20, 
  },
  logo: {
    width: 200, // BÜYÜTÜLDÜ (100'den)
    height: 200, // BÜYÜTÜLDÜ (100'den)
    borderRadius: 24, // Daha yuvarlak köşeler
  },
  exploreSection: {
    paddingHorizontal: 14, 
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridButtonWrapper: {
    flex: 1,
    maxWidth: '50%', 
    padding: 6, 
  },
  gridCard: {
    flex: 1,
    padding: 16, // Padding'i biraz azalttık
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: 100, // Yüksekliği biraz azalttık
    backgroundColor: Colors.light.cardBackground, 
    borderWidth: 0, 
  },
  gridCardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text, 
    textAlign: 'center',
  },
});
