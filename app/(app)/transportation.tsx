import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import Colors from '@/src/constants/Colors';
import { ThemedCard } from '@/components/ThemedCard';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

const CLINIC_COORDINATES = {
  latitude: 41.0205,
  longitude: 29.1415,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// İçerik blokları için yardımcı bileşen
const InfoBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.heading}>{title}</Text>
    {children}
  </View>
);

// Adımlar için yardımcı bileşen
const Step: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.step}>
    <Ionicons name="ellipse-sharp" size={8} color={Colors.light.textSecondary} style={styles.stepDot} />
    <Text style={styles.paragraph}>{text}</Text>
  </View>
);

export default function TransportationScreen() {
  const language = useSettingsStore((state) => state.language);
  return (
    <>
      <Stack.Screen options={{ title: t('transportation.title') }} />
      <ScrollView style={styles.container}>
        
        {/* --- 1. HARİTA --- */}
        <MapView style={styles.map} initialRegion={CLINIC_COORDINATES}>
          <Marker
            coordinate={CLINIC_COORDINATES}
            title={t('transportation.addressLine1')}
            description={t('transportation.addressLine2')}
          />
        </MapView>

        {/* --- 2. GİRİŞ VE ADRES --- */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>{t('transportation.subtitle')}</Text>
          <Text style={styles.welcomeText}>{t('transportation.welcomeMessage')}</Text>
        </View>

        <ThemedCard style={styles.addressCard}>
          <Text style={styles.addressTitle}>{t('transportation.fullAddress')}</Text>
          <Text style={styles.addressText}>{t('transportation.addressLine1')}</Text>
          <Text style={styles.addressText}>{t('transportation.addressLine2')}</Text>
          <Text style={styles.addressText}>{t('transportation.addressLine3')}</Text>
        </ThemedCard>

        {/* --- 3. HIZLI BAKIŞ --- */}
        <InfoBlock title={t('transportation.glanceTitle')}>
          <Step text={`${t('transportation.glanceMetroM8')} (${t('transportation.glanceMetroM8Desc')})`} />
          <Step text={`${t('transportation.glanceMetroM5')} (${t('transportation.glanceMetroM5Desc')})`} />
          <Step text={`${t('transportation.glanceBus')} (${t('transportation.glanceBusDesc')})`} />
        </InfoBlock>

        {/* --- 4. HAVALİMANLARI --- */}
        <InfoBlock title={t('transportation.airportsTitle')}>
          <Text style={styles.paragraph}>{t('transportation.airportsDesc')}</Text>
          
          <Text style={styles.subheading}>{t('transportation.sawTitle')}</Text>
          <Text style={styles.paragraph}>{t('transportation.sawDesc')}</Text>
          <Text style={styles.routeTitle}>{t('transportation.sawRoute1Title')}</Text>
          <Step text={t('transportation.sawRoute1Step1')} />
          <Step text={t('transportation.sawRoute1Step2')} />
          <Step text={t('transportation.sawRoute1Step3')} />
          <Step text={t('transportation.sawRoute1Step4')} />
          <Step text={t('transportation.sawRoute1Step5')} />
          <Step text={t('transportation.sawRoute1Step6')} />
          
          <Text style={styles.routeTitle}>{t('transportation.sawRoute2Title')}</Text>
          <Step text={t('transportation.sawRoute2Step1')} />
          <Step text={t('transportation.sawRoute2Step2')} />

          <Text style={styles.subheading}>{t('transportation.istTitle')}</Text>
          <Text style={styles.paragraph}>{t('transportation.istDesc')}</Text>
          <Text style={styles.routeTitle}>{t('transportation.istRoute1Title')}</Text>
          <Step text={t('transportation.istRoute1Step1')} />
          <Step text={t('transportation.istRoute1Step2')} />
          <Step text={t('transportation.istRoute1Step3')} />

          <Text style={styles.routeTitle}>{t('transportation.istRoute2Title')}</Text>
          <Step text={t('transportation.istRoute2Step1')} />
          <Step text={t('transportation.istRoute2Step2')} />
          <Step text={t('transportation.istRoute2Step3')} />
          <Step text={t('transportation.istRoute2Step4')} />
          <Step text={t('transportation.istRoute2Step5')} />
          <Step text={t('transportation.istRoute2Step6')} />
        </InfoBlock>
        
        {/* --- 5. DİĞER ULAŞIMLAR --- */}
        <InfoBlock title={t('transportation.cityTitle')}>
          <Text style={styles.routeTitle}>{t('transportation.cityMetroTitle')}</Text>
          <Text style={styles.paragraph}>{t('transportation.cityMetroDesc')}</Text>
          <Text style={styles.routeTitle}>{t('transportation.cityMetrobusTitle')}</Text>
          <Text style={styles.paragraph}>{t('transportation.cityMetrobusDesc')}</Text>
        </InfoBlock>

        <InfoBlock title={t('transportation.busTitle')}>
           <Step text={t('transportation.busEsenler')} />
           <Step text={t('transportation.busDudullu')} />
        </InfoBlock>
        
        <InfoBlock title={t('transportation.taxiTitle')}>
           <Text style={styles.paragraph}>{t('transportation.taxiDesc')}</Text>
        </InfoBlock>

        {/* --- 6. İPUÇLARI --- */}
        <InfoBlock title={t('transportation.tipsTitle')}>
          <ThemedCard style={styles.tipsCard}>
            <Step text={t('transportation.tipsIstanbulkart')} />
            <Step text={t('transportation.tipsApps')} />
            <Step text={t('transportation.tipsRushHour')} />
          </ThemedCard>
        </InfoBlock>

      </ScrollView>
    </>
  );
}

// --- Stilleri Ekle ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  map: {
    width: '100%',
    height: 250,
  },
  header: {
    padding: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  addressCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  section: {
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.accent,
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepDot: {
    marginRight: 10,
    marginTop: 7,
  },
  tipsCard: {
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
  },
});
