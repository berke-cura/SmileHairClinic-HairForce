// src/components/CollapsibleCardItem.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedCard } from '@/components/ThemedCard';
import Colors from '@/src/constants/Colors';

interface CollapsibleCardItemProps {
  title: string;
  content: string;
}

/**
 * FAQ ve PatientGuide için yeniden kullanılabilir,
 * tıklanınca açılan içerik kartı.
 */
export const CollapsibleCardItem: React.FC<CollapsibleCardItemProps> = ({
  title,
  content,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ThemedCard variant="outlined" style={styles.card}>
      <TouchableOpacity
        style={styles.questionContainer}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.question}>{title}</Text>
        <Ionicons
          name={isOpen ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color={Colors.light.accent}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{content}</Text>
        </View>
      )}
    </ThemedCard>
  );
};

// FAQScreen'den stilleri buraya taşıdık
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0, // Yatay boşluğu parent'ı (content) verecek
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: 16,
  },
  answer: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
});

