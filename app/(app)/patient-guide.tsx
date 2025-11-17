// app/(app)/patient-guide.tsx
import { CollapsibleCardItem } from '@/src/components/CollapsibleCardItem'; // <-- YENİ İMPORT
import Colors from '@/src/constants/Colors';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// 1. FAQ ekranındaki gibi bir veri yapısı oluşturalım
interface GuideItem {
  id: string;
  titleKey: string;
  contentKey: string;
}

const guideItems: GuideItem[] = [
  { id: '1', titleKey: 'patientGuide.preOp', contentKey: 'patientGuide.preOpContent' },
  { id: '2', titleKey: 'patientGuide.opDay', contentKey: 'patientGuide.opDayContent' },
  { id: '3', titleKey: 'patientGuide.postOp', contentKey: 'patientGuide.postOpContent' },
  { id: '4', titleKey: 'patientGuide.hairWashing', contentKey: 'patientGuide.hairWashingContent' },
];

export default function PatientGuideScreen() {
  const language = useSettingsStore((state) => state.language);
  return (
    <>
      <Stack.Screen options={{ title: t('patientGuide.title') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('patientGuide.subtitle')}</Text>
        </View>

        {/* 2. <Collapsible> yerine yeni bileşenimizi map edelim */}
        <View style={styles.content}>
          {guideItems.map((item) => (
            <CollapsibleCardItem
              key={item.id}
              title={t(item.titleKey)}
              content={t(item.contentKey)}
            />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

// 3. Stilleri FAQScreen ile aynı olacak şekilde güncelleyelim
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
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20, // Kartlara yatay boşluk vermek için
  },
  // 'sectionText' stili artık CollapsibleCardItem içinde.
});

