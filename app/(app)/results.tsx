import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import Colors from '@/src/constants/Colors';
import { t } from '@/src/services/i18n';
import { usePoseCameraStore } from '@/src/stores/poseCameraStore';
import { CapturedPhoto, usePhotoHistoryStore } from '@/src/stores/usePhotoHistoryStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { Pose } from '@/src/types/pose';
import * as Crypto from 'expo-crypto';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

// Cloud Function URL for generating signed URLs
const CLOUD_FUNCTION_URL = 'https://generate-upload-urls-531029793637.europe-west1.run.app';

// Photo grid item with tag
const PhotoGridItem: React.FC<{ item: { uri: string; pose: Pose } }> = ({ item }) => (
  <ThemedCard variant="elevated" style={styles.photoContainer}>
    <Image source={{ uri: item.uri }} style={styles.photo} />
    <View style={styles.tagContainer}>
      <Text style={styles.tagText}>{item.pose}</Text>
    </View>
  </ThemedCard>
);

export default function ResultsScreen() {
  const language = useSettingsStore((state) => state.language);
  const router = useRouter();
  const capturedPhotos = usePoseCameraStore((state) => state.capturedPhotos);
  const addSession = usePhotoHistoryStore((state) => state.addSession);
  const resetCameraStore = usePoseCameraStore((state) => state.resetSequence);
  const [isUploading, setIsUploading] = useState(false);

  // Generate unique user ID for organizing photos in folders
  const [userId] = useState(() => Crypto.randomUUID());

  /**
   * Uploads a local file (file://) to a signed URL
   */
  const uploadToSignedUrl = async (localUri: string, signedUrl: string) => {
    try {
      // 1. Read local file as blob (binary data)
      const response = await fetch(localUri);
      const blob = await response.blob();

      // 2. Upload blob data to signed URL using PUT method
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed with status: ' + uploadResponse.status);
      }

      return true;
    } catch (error) {
      console.error('Upload failed for:', localUri, error);
      throw error;
    }
  };

  /**
   * Called when SAVE button is pressed
   */
  const handleSave = async () => {
    if (isUploading) return;

    setIsUploading(true);

    try {
      // 1. Prepare list of poses to upload
      const poses = capturedPhotos.map((p) => p.pose); // ['FRONT', 'TOP', ...]

      // 2. Call Cloud Function to get signed URLs
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poses: poses,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Cloud Function failed to get URLs');
      }

      // Response: { FRONT: { signedUrl: '...', gcsPath: '...' }, TOP: ... }
      const signedUrlsByPose = await response.json();

      // 3. Upload all photos in parallel
      const uploadPromises = capturedPhotos.map((photo) => {
        const { signedUrl } = signedUrlsByPose[photo.pose];
        return uploadToSignedUrl(photo.uri, signedUrl);
      });

      await Promise.all(uploadPromises);

      // 4. Upload successful. Save NEW (persistent) GCS paths to History Store
      const newSessionPhotos: CapturedPhoto[] = capturedPhotos.map((photo) => ({
        uri: signedUrlsByPose[photo.pose].gcsPath, // <-- Now 'gs://' path
        pose: photo.pose,
      }));

      addSession(newSessionPhotos);

      // 5. Reset camera state and return to home screen
      resetCameraStore();
      router.replace('/(app)/');
    } catch (error) {
      console.error('Save operation failed:', error);
      setIsUploading(false);
      // Show error to user
      Alert.alert(t('common.error'), t('errors.uploadFailed'));
    }
  };

  const handleRetake = () => {
    if (isUploading) return;
    resetCameraStore();
    router.replace('/camera');
  };

  return (
    <>
      <Stack.Screen options={{ title: t('navigation.results') }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>{t('results.title')}</Text>
        <Text style={styles.description}>
          {t('results.subtitle', { count: capturedPhotos.length })}
        </Text>
      </View>

      <View style={styles.gridContainer}>
        {capturedPhotos.map((item) => (
          <PhotoGridItem key={item.uri} item={item} />
        ))}
      </View>

      {/* Loading indicator */}
      {isUploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>{t('results.uploading')}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <ThemedButton
          title={t('results.retake')}
          onPress={handleRetake}
          variant="secondary"
          style={styles.button}
          disabled={isUploading}
        />
        <ThemedButton
          title={t('results.save')}
          onPress={handleSave}
          variant="primary"
          style={styles.button}
          disabled={isUploading}
        />
      </View>
      </ScrollView>
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
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
  },
  photoContainer: {
    width: '45%',
    margin: 8,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.light.text,
    marginTop: 10,
    fontSize: 16,
  },
});

