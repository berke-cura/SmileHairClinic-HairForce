import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { Stack, Link } from 'expo-router';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { doctorsData } from '@/src/data/doctorsData';
import { ThemedCard } from '@/components/ThemedCard';
import Colors from '@/src/constants/Colors';

// Kompakt, ortalanmış kart tasarımı ile DoctorCard bileşeni
const DoctorCard: React.FC<{ doctor: typeof doctorsData[0] }> = ({ doctor }) => {
  // Dil değişikliğini dinlemek için bu hook'u çağır
  const language = useSettingsStore((state) => state.language);
  return (
    <Link href={`/(app)/doctors/${doctor.id}`} asChild>
      <Pressable>
        <ThemedCard style={styles.card}>
          {/* Yuvarlak doktor fotoğrafı */}
          <Image source={{ uri: doctor.imageUrl }} style={styles.doctorImage} />
          
          {/* Metinleri 't' fonksiyonu ile çek */}
          <Text style={styles.doctorName}>{t(doctor.nameKey)}</Text>
          <Text style={styles.doctorTitle}>{t(doctor.titleKey)}</Text>
        </ThemedCard>
      </Pressable>
    </Link>
  );
};

export default function DoctorsScreen() {
  const language = useSettingsStore((state) => state.language);
  return (
    <>
      <Stack.Screen options={{ title: t('doctors.title') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('doctors.subtitle')}</Text>
        </View>
        <View style={styles.list}>
          {doctorsData.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
  },
  headerText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.border,
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  doctorTitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});

