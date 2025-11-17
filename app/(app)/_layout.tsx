import { Stack } from 'expo-router';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

export default function AppLayout() {
  const language = useSettingsStore((state) => state.language);
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="results" 
        options={{ title: t('navigation.results') }} 
      />
      <Stack.Screen 
        name="history" 
        options={{ title: t('navigation.history') }} 
      />
      <Stack.Screen 
        name="transportation" 
        options={{ title: t('navigation.transportation') }} 
      />
      {/* --- YENİ EKLENEN EKRANLAR --- */}
      <Stack.Screen 
        name="doctors" 
        options={{ title: t('doctors.title') }} 
      />
      <Stack.Screen 
        name="before-after" 
        options={{ title: t('beforeAfter.title') }} 
      />
      <Stack.Screen 
        name="patient-guide" 
        options={{ title: t('patientGuide.title') }} 
      />
      <Stack.Screen 
        name="faq" 
        options={{ title: t('faq.title') }} 
      />
      <Stack.Screen 
        name="contact" 
        options={{ title: t('contact.title'), presentation: 'modal' }} 
      />
    </Stack>
  );
}

