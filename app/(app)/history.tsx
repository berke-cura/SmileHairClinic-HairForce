import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Stack, Link } from 'expo-router';
import { usePhotoHistoryStore } from '@/src/stores/usePhotoHistoryStore';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { PhotoSession } from '@/src/stores/usePhotoHistoryStore';
import { ThemedCard } from '@/components/ThemedCard';
import Colors from '@/src/constants/Colors';

// Session card component
const SessionCard: React.FC<{ session: PhotoSession }> = ({ session }) => {
  const date = new Date(session.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link href={`/(app)/history/${session.id}`} asChild>
      <Pressable>
        <ThemedCard variant="elevated" style={styles.sessionCard}>
          <Text style={styles.sessionDate}>{t('history.sessionDate', { date: formattedDate })}</Text>
          <Text style={styles.sessionPhotoCount}>
            {t('history.photoCount', { count: session.photos.length })}
          </Text>
        </ThemedCard>
      </Pressable>
    </Link>
  );
};

export default function HistoryScreen() {
  const language = useSettingsStore((state) => state.language);
  const sessions = usePhotoHistoryStore((state) => state.sessions);

  return (
    <>
      <Stack.Screen options={{ title: t('navigation.history') }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('history.title')}</Text>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('history.emptyMessage')}</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SessionCard session={item} />}
            contentContainerStyle={styles.sessionsContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  sessionsContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sessionCard: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sessionDate: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sessionPhotoCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

