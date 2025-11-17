// app/(app)/faq.tsx
import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { t } from '@/src/services/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import Colors from '@/src/constants/Colors';
import { CollapsibleCardItem } from '@/src/components/CollapsibleCardItem'; // <-- YENİ İMPORT

// FAQ data structure
interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
}

const faqItems: FAQItem[] = [
  { id: '1', questionKey: 'faq.q1', answerKey: 'faq.a1' },
  { id: '2', questionKey: 'faq.q2', answerKey: 'faq.a2' },
  { id: '3', questionKey: 'faq.q3', answerKey: 'faq.a3' },
  { id: '4', questionKey: 'faq.q4', answerKey: 'faq.a4' },
  { id: '5', questionKey: 'faq.q5', answerKey: 'faq.a5' },
  { id: '6', questionKey: 'faq.q6', answerKey: 'faq.a6' },
];

// Artık lokal 'FAQItemComponent'e gerek yok.

export default function FAQScreen() {
  const language = useSettingsStore((state) => state.language);
  return (
    <>
      <Stack.Screen options={{ title: t('faq.title') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('faq.subtitle')}</Text>
        </View>
        <View style={styles.content}>
          {faqItems.map((item) => (
            <CollapsibleCardItem
              key={item.id}
              title={t(item.questionKey)}
              content={t(item.answerKey)}
            />
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
  // Diğer stiller (faqItem, question, answer vs.) artık CollapsibleCardItem.tsx içinde.
});

