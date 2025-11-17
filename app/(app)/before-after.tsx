// app/(app)/before-after.tsx
import React from 'react';
import { StyleSheet, View, Text, FlatList, Image } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { ThemedCard } from '@/components/ThemedCard';
import { galleryImages } from '@/src/data/galleryData';
import Colors from '@/src/constants/Colors';

/**
 * Sadece fotoğrafı gösteren basit galeri kartı
 */
const GalleryCard: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  return (
    <View style={styles.cardWrapper}>
      <ThemedCard style={styles.card}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </ThemedCard>
    </View>
  );
};

export default function BeforeAfterScreen() {
  const language = useSettingsStore((state) => state.language);
  return (
    <>
      <Stack.Screen options={{ title: t('beforeAfter.title') }} />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.listContent}
        data={galleryImages}
        keyExtractor={(item, index) => item + index}
        numColumns={2}
        renderItem={({ item }) => <GalleryCard imageUrl={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerText}>{t('beforeAfter.subtitle')}</Text>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 10,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  cardWrapper: {
    flex: 1,
    padding: 6,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
});

