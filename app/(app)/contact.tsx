import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import Colors from '@/src/constants/Colors';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { Ionicons } from '@expo/vector-icons';

// --- 1. Statik Bilgiler ---
const phoneNumber = '+905491492400'; // Uluslararası format
const phoneDisplay = 'T: 549 149 24 00';
const email = 'info@smilehairclinic.com';
const address = 'Tatlısu, Alptekin Cd. No:15, 34774 Ümraniye/İstanbul, Türkiye';
const whatsappUrl = 'https://wa.me/905491492400';

export default function ContactScreen() {
  const language = useSettingsStore((state) => state.language);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // --- 2. Dış Bağlantı Fonksiyonları ---
  const handlePress = async (url: string, type: 'tel' | 'mailto' | 'https' = 'https') => {
    const fullUrl = type === 'tel' ? `tel:${url}` : (type === 'mailto' ? `mailto:${url}` : url);
    
    const supported = await Linking.canOpenURL(fullUrl);
    if (supported) {
      await Linking.openURL(fullUrl);
    } else {
      Alert.alert(t('contact.errorTitle'), t('contact.errorMessage', { url: fullUrl }));
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone) {
      Alert.alert(t('contact.validationError'), t('contact.validationMessage'));
      return;
    }

    // TODO: Implement actual form submission logic
    Alert.alert(t('contact.successTitle'), t('contact.successMessage'));
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: t('contact.title'), presentation: 'modal' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('contact.subtitle')}</Text>
        </View>

        {/* --- 3. Hızlı Eylem Butonları --- */}
        <View style={styles.actionSection}>
          <ThemedButton
            title={t('contact.callNow')}
            variant="primary"
            onPress={() => handlePress(phoneNumber, 'tel')}
            icon={<Ionicons name="call" size={20} color={Colors.light.textLight} />}
          />
          <ThemedButton
            title={t('contact.whatsApp')}
            variant="success"
            onPress={() => handlePress(whatsappUrl, 'https')}
            icon={<Ionicons name="logo-whatsapp" size={20} color={Colors.light.textLight} />}
            style={{ marginTop: 12 }}
          />
        </View>

        {/* --- 4. Statik Bilgi Kartı --- */}
        <ThemedCard style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('contact.detailsTitle')}</Text>
          <InfoRow 
            icon="location-outline" 
            label={t('contact.address')} 
            value={address} 
          />
          <InfoRow 
            icon="mail-outline" 
            label={t('contact.email')} 
            value={email}
            onPress={() => handlePress(email, 'mailto')}
          />
          <InfoRow 
            icon="call-outline" 
            label={t('contact.phone')} 
            value={phoneDisplay}
            onPress={() => handlePress(phoneNumber, 'tel')}
          />
        </ThemedCard>

        {/* --- 5. Mesaj Formu --- */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>{t('contact.formTitle')}</Text>
          <ThemedInput
            label={t('contact.name')}
            placeholder={t('contact.namePlaceholder')}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <ThemedInput
            label={t('contact.email')}
            placeholder={t('contact.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
          <ThemedInput
            label={t('contact.phone')}
            placeholder={t('contact.phonePlaceholder')}
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
          />
          <ThemedInput
            label={t('contact.message')}
            placeholder={t('contact.messagePlaceholder')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            inputStyle={styles.textArea}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
          />
          <ThemedButton
            title={t('contact.send')}
            variant="primary"
            onPress={handleSubmit}
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </>
  );
}

// Statik bilgi satırı için yardımcı bileşen
const InfoRow: React.FC<{
  icon: any;
  label: string;
  value: string;
  onPress?: () => void;
}> = ({ icon, label, value, onPress }) => (
  <Pressable style={styles.infoRow} onPress={onPress} disabled={!onPress}>
    <Ionicons name={icon} size={22} color={Colors.light.accent} style={styles.infoIcon} />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} selectable>{value}</Text>
    </View>
    {onPress && <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />}
  </Pressable>
);

// --- 6. Stilleri Güncelle ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 24,
  },
  headerText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailsCard: {
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  formSection: {
    padding: 20,
    marginTop: 12,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
});
