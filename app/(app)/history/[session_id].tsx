import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { usePhotoHistoryStore, CapturedPhoto } from '@/src/stores/usePhotoHistoryStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { t } from '@/src/services/i18n';
import { Pose } from '@/src/types/pose';
import { ThemedCard } from '@/components/ThemedCard';
import Colors from '@/src/constants/Colors';

// Photo grid item component with tag
const PhotoGridItem: React.FC<{ item: CapturedPhoto }> = ({ item }) => (
  <ThemedCard variant="elevated" style={styles.photoContainer}>
    <Image source={{ uri: item.uri }} style={styles.photo} />
    <View style={styles.tagContainer}>
      <Text style={styles.tagText}>{item.pose}</Text>
    </View>
  </ThemedCard>
);

export default function SessionDetailScreen() {
  const language = useSettingsStore((state) => state.language);
  const { session_id } = useLocalSearchParams<{ session_id: string }>();

  // Find the session from store
  const session = usePhotoHistoryStore((state) =>
    state.sessions.find((s) => s.id === session_id)
  );

  if (!session) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t('history.title') }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('errors.sessionNotFound')}</Text>
        </View>
      </View>
    );
  }

  const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('history.sessionFrom') }} />

      <FlatList
        data={session.photos}
        keyExtractor={(item) => item.uri}
        numColumns={2}
        renderItem={({ item }) => <PhotoGridItem item={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t('history.sessionDate', { date: sessionDate })}</Text>
            <Text style={styles.description}>
              {t('history.photoCount', { count: session.photos.length })}
            </Text>
          </View>
        }
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  gridContainer: {
    padding: 10,
    paddingBottom: 40,
  },
  photoContainer: {
    flex: 1,
    margin: 5,
    padding: 0,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.light.backgroundDark,
  },
  tagContainer: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tagText: {
    color: Colors.light.textLight,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});

