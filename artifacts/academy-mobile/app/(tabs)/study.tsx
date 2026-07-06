import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { monoFont, monoFontBold } from "@/constants/fonts";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import type { GEDSubjectKey, StudyQuestion } from "@/lib/studyTemplates";

const SUBJECTS: { key: GEDSubjectKey; label: string }[] = [
  { key: "math", label: "Math Reasoning" },
  { key: "language_arts", label: "Language Arts" },
  { key: "science", label: "Science" },
  { key: "social_studies", label: "Social Studies" },
];

function QuestionCard({
  question,
  onAnswer,
}: {
  question: StudyQuestion;
  onAnswer: (choice: string) => boolean;
}) {
  const colors = useColors();
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const choices = question.choices ?? ["True", "False"];

  const handleChoice = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    setCorrect(onAnswer(choice));
  };

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <Text style={[styles.topic, { color: colors.accent }]}>{question.topic.toUpperCase()}</Text>
      <Text style={[styles.question, { color: colors.foreground }]}>{question.question}</Text>
      <View style={styles.choices}>
        {choices.map((choice) => {
          const isSelected = selected === choice;
          const isAnswerChoice = choice.trim().toLowerCase() === question.answer.trim().toLowerCase();
          const showState = selected !== null && (isSelected || isAnswerChoice);
          const stateColor = showState
            ? isAnswerChoice
              ? colors.primary
              : colors.destructive
            : colors.mutedForeground;
          return (
            <Pressable
              key={choice}
              onPress={() => handleChoice(choice)}
              disabled={selected !== null}
              style={({ pressed }) => [
                styles.choice,
                { borderColor: stateColor, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.choiceText, { color: stateColor }]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <Text style={[styles.explanation, { color: correct ? colors.primary : colors.accent }]}>
          {correct ? "CORRECT — " : "REVIEW — "}
          {question.explanation}
        </Text>
      ) : null}
    </View>
  );
}

export default function StudyScreen() {
  const colors = useColors();
  const { isOnline, studyProgress, getQuizSet, answerQuestion } = useGame();
  const [subject, setSubject] = useState<GEDSubjectKey | null>(null);

  const questions = useMemo(() => (subject ? getQuizSet(subject) : []), [subject]);

  if (!subject) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.primary, textShadowColor: colors.primary }]}>
            GED PREP
          </Text>
          <StatusBadge isOnline={isOnline} />
        </View>
        <ScrollView contentContainerStyle={styles.listContent}>
          {SUBJECTS.map((s) => {
            const progress = studyProgress[s.key];
            return (
              <Pressable
                key={s.key}
                onPress={() => setSubject(s.key)}
                style={({ pressed }) => [
                  styles.subjectRow,
                  { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.subjectLabel, { color: colors.primary }]}>{s.label}</Text>
                <Text style={[styles.subjectStats, { color: colors.mutedForeground }]}>
                  {progress.correct}/{progress.answered} correct
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Pressable onPress={() => setSubject(null)}>
          <Text style={[styles.headerTitle, { color: colors.primary, textShadowColor: colors.primary }]}>
            {"< "}
            {SUBJECTS.find((s) => s.key === subject)?.label.toUpperCase()}
          </Text>
        </Pressable>
        <StatusBadge isOnline={isOnline} />
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} onAnswer={(choice) => answerQuestion(q, choice)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    ...monoFontBold,
    fontSize: 16,
    letterSpacing: 1,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  listContent: { padding: 16, gap: 12 },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 14,
  },
  subjectLabel: { ...monoFontBold, fontSize: 14 },
  subjectStats: { ...monoFont, fontSize: 11 },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  topic: { ...monoFontBold, fontSize: 10, letterSpacing: 1 },
  question: { ...monoFont, fontSize: 14, lineHeight: 20 },
  choices: { gap: 8 },
  choice: {
    borderWidth: 1,
    padding: 10,
  },
  choiceText: { ...monoFont, fontSize: 12 },
  explanation: {
    ...monoFont,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
});
