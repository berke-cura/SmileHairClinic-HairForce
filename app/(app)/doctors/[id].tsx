import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { doctorsData } from '@/src/data/doctorsData';
import { ThemedCard } from '@/components/ThemedCard';
import Colors from '@/src/constants/Colors';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

// Röportaj Soru/Cevap tipi (i18n'den gelecek)
interface InterviewItem {
  q: string;
  a: string;
}

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Dil değişikliğini dinle
  const language = useSettingsStore((state) => state.language); 
  
  const doctor = doctorsData.find((d) => d.id === id);

  if (!doctor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('errors.doctorNotFound')}</Text>
      </View>
    );
  }

  // --- i18n'den verileri çek ---
  // i18n-js, JSON'daki dizileri ve objeleri otomatik olarak doğru tipte döndürür
  const doctorName = t(doctor.nameKey);
  const doctorTitle = t(doctor.titleKey);
  const bioParagraphs = t(doctor.bioKey) as string[]; // Metin paragraf dizisi
  const interviewItems = t(doctor.interviewKey) as InterviewItem[]; // Soru/Cevap dizisi
  // --- Veri çekme sonu ---

  return (
    <>
      <Stack.Screen options={{ title: doctorName }} />
      <ScrollView style={styles.container}>
        <Image source={{ uri: doctor.imageUrl }} style={styles.headerImage} />

        <View style={styles.content}>
          <Text style={styles.name}>{doctorName}</Text>
          <Text style={styles.title}>{doctorTitle}</Text>

          <Text style={styles.sectionTitle}>{t('doctors.bioTitle')}</Text>
          <ThemedCard style={styles.bioCard}>
            {bioParagraphs.map((paragraph, index) => (
              <Text key={index} style={styles.bioText}>
                {paragraph}
              </Text>
            ))}
          </ThemedCard>

          <Text style={styles.sectionTitle}>{t('doctors.interviewTitle')}</Text>
          {interviewItems.map((item, index) => (
            <ThemedCard key={index} style={styles.qaCard} variant="outlined">
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.answer}>{item.a}</Text>
            </ThemedCard>
          ))}
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
  headerImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.light.cardBackground,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  bioCard: {
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
  },
  bioText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 23,
    marginBottom: 16,
  },
  qaCard: {
    padding: 20,
    marginBottom: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  answer: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 23,
  },
  errorText: {
    padding: 20,
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
  },
});

