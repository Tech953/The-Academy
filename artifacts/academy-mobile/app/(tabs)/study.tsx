import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { monoFont, monoFontBold } from "@/constants/fonts";
import {
  getMobileCopy,
  type MobileCopyKey,
} from "@/constants/locales";
import { useGame } from "@/context/GameContext";
import type { EnrichmentStatus } from "@/lib/enrichmentStatus";
import { useColors } from "@/hooks/useColors";
import {
  focusSubjectKey,
  generateOfflineContentPack,
  isQuestionFocusMatched,
  type GEDSubjectKey,
  type StudyQuestion,
} from "@workspace/game-engine";

const SUBJECTS: { key: GEDSubjectKey; labelKey: MobileCopyKey }[] = [
  { key: "math", labelKey: "mathReasoning" },
  { key: "language_arts", labelKey: "languageArts" },
  { key: "science", labelKey: "science" },
  { key: "social_studies", labelKey: "socialStudies" },
];

function QuestionCard({
  question,
  onAnswer,
  isFocusMatched,
  locale,
}: {
  question: StudyQuestion;
  onAnswer: (choice: string) => boolean;
  isFocusMatched: boolean;
  locale: string;
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
      <View style={styles.topicRow}>
        <Text style={[styles.topic, { color: colors.accent }]}>{question.topic.toUpperCase()}</Text>
        <View
          style={[
            styles.focusBadge,
            { borderColor: isFocusMatched ? colors.accent : colors.border },
          ]}
        >
          <Text
            style={[
              styles.focusBadgeText,
              { color: isFocusMatched ? colors.accent : colors.mutedForeground },
            ]}
          >
            {getMobileCopy(
              isFocusMatched ? "weeklyFocus" : "generalPractice",
              locale,
            )}
          </Text>
        </View>
      </View>
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
          {correct
            ? `${getMobileCopy("correct", locale).toUpperCase()} — `
            : `${getMobileCopy("review", locale)} — `}
          {question.explanation}
        </Text>
      ) : null}
    </View>
  );
}

function StudyAvailabilityNotice({
  status,
  isOnline,
  onRetry,
  retryLoading,
  locale,
}: {
  status: EnrichmentStatus;
  isOnline: boolean;
  onRetry?: () => void;
  retryLoading: boolean;
  locale: string;
}) {
  if (status === "checking" || status === "live") return null;

  return (
    <View style={styles.availabilityNotice}>
      <Text style={styles.availabilityTitle}>
        {status === "rate_limited"
          ? getMobileCopy("liveRequestPaused", locale)
          : status === "fallback"
          ? getMobileCopy("liveEnrichmentUnavailable", locale)
          : getMobileCopy("offlineStudyMode", locale)}
      </Text>
      <Text style={styles.availabilityCopy}>
        {status === "rate_limited"
          ? getMobileCopy("liveRequestsPausedCopy", locale)
          : getMobileCopy("bundledStudyContentCopy", locale)}
      </Text>
      {status === "fallback" && isOnline ? (
        <Pressable
          accessibilityLabel={getMobileCopy("retryLiveEnrichment", locale)}
          accessibilityRole="button"
          disabled={retryLoading}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            { opacity: pressed || retryLoading ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.retryButtonText}>
            {retryLoading
              ? getMobileCopy("retryingLiveRefresh", locale)
              : getMobileCopy("retryLiveRefresh", locale)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function StudyScreen() {
  const colors = useColors();
  const {
    isOnline,
    enrichmentStatus,
    contentPackLoading,
    day,
    week,
    studyProgress,
    contentPack,
    getQuizSet,
    answerQuestion,
    refreshContentPack,
    bulletinLocale,
  } = useGame();
  const [subject, setSubject] = useState<GEDSubjectKey | null>(null);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const preserveQuestionsAfterRetryRef = useRef(false);

  // Show the bundled pack immediately, then replace it with the synced pack
  // when available. This keeps the weekly focus useful while fully offline.
  const studyPack = useMemo(
    () => contentPack ?? generateOfflineContentPack(day),
    [contentPack, day],
  );
  const focusAreas = studyPack.gedFocusAreas;
  const focusBySubject = useMemo(() => {
    const grouped: Partial<Record<GEDSubjectKey, typeof focusAreas>> = {};
    for (const focus of focusAreas) {
      const key = focusSubjectKey(focus.subject);
      if (!key) continue;
      grouped[key] = [...(grouped[key] ?? []), focus];
    }
    return grouped;
  }, [focusAreas]);
  const orderedSubjects = useMemo(
    () =>
      [...SUBJECTS].sort(
        (a, b) => Number(Boolean(focusBySubject[b.key])) - Number(Boolean(focusBySubject[a.key])),
      ),
    [focusBySubject],
  );
  const currentFocusTopics = useMemo(
    () => (subject ? (focusBySubject[subject] ?? []).map((focus) => focus.topic) : []),
    [focusBySubject, subject],
  );
  const selectSubject = useCallback((nextSubject: GEDSubjectKey) => {
    preserveQuestionsAfterRetryRef.current = false;
    setSubject(nextSubject);
    setQuestions(getQuizSet(nextSubject));
  }, [getQuizSet]);
  const retryLiveRefresh = useCallback(async () => {
    preserveQuestionsAfterRetryRef.current = true;
    await refreshContentPack();
  }, [refreshContentPack]);

  useEffect(() => {
    if (!subject || preserveQuestionsAfterRetryRef.current) return;
    setQuestions(getQuizSet(subject));
  }, [getQuizSet, subject]);

  if (!subject) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.primary, textShadowColor: colors.primary }]}>
            {getMobileCopy("gedPrep", bulletinLocale)}
          </Text>
          <StatusBadge
            isOnline={isOnline}
            enrichmentStatus={enrichmentStatus}
            locale={bulletinLocale}
          />
        </View>
        <ScrollView contentContainerStyle={styles.listContent}>
          <StudyAvailabilityNotice
            status={enrichmentStatus}
            isOnline={isOnline}
            onRetry={retryLiveRefresh}
            retryLoading={contentPackLoading}
              locale={bulletinLocale}
          />
          <View style={[styles.focusPanel, { borderColor: colors.accent }]}>
            <Text style={[styles.focusLabel, { color: colors.accent }]}>
              {getMobileCopy("week", bulletinLocale)} {week}{" "}
              {getMobileCopy("weeklyStudyFocus", bulletinLocale)}
            </Text>
            <Text style={[styles.focusTheme, { color: colors.foreground }]}>
              {studyPack.weeklyTheme}
            </Text>
            {focusAreas.map((focus, index) => (
              <View key={`${focus.subject}-${focus.topic}-${index}`} style={styles.focusItem}>
                <Text style={[styles.focusTopic, { color: colors.primary }]}>
                  {focus.subject} · {focus.topic}
                </Text>
                <Text style={[styles.focusWhy, { color: colors.mutedForeground }]}>
                  {focus.whyNow}
                </Text>
              </View>
            ))}
          </View>
          {orderedSubjects.map((s) => {
            const progress = studyProgress[s.key];
            const subjectFocus = focusBySubject[s.key] ?? [];
            const isFocused = subjectFocus.length > 0;
            return (
              <Pressable
                key={s.key}
                onPress={() => selectSubject(s.key)}
                style={({ pressed }) => [
                  styles.subjectRow,
                  {
                    borderColor: isFocused ? colors.accent : colors.border,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <View style={styles.subjectCopy}>
                  <Text style={[styles.subjectLabel, { color: isFocused ? colors.accent : colors.primary }]}>
                    {getMobileCopy(s.labelKey, bulletinLocale)}
                  </Text>
                  {subjectFocus.map((focus, index) => (
                    <Text
                      key={`${focus.topic}-${index}`}
                      style={[styles.subjectFocus, { color: colors.mutedForeground }]}
                    >
                      {getMobileCopy("focus", bulletinLocale)}: {focus.topic}
                    </Text>
                  ))}
                </View>
                <View style={styles.subjectMeta}>
                  {isFocused ? (
                    <Text style={[styles.thisWeek, { color: colors.accent }]}>
                      {getMobileCopy("thisWeek", bulletinLocale)}
                    </Text>
                  ) : null}
                  <Text style={[styles.subjectStats, { color: colors.mutedForeground }]}>
                    {progress.correct}/{progress.answered}{" "}
                    {getMobileCopy("correct", bulletinLocale)}
                  </Text>
                </View>
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
            {getMobileCopy(
              SUBJECTS.find((s) => s.key === subject)?.labelKey ?? "gedPrep",
              bulletinLocale,
            ).toUpperCase()}
          </Text>
        </Pressable>
        <StatusBadge
          isOnline={isOnline}
          enrichmentStatus={enrichmentStatus}
          locale={bulletinLocale}
        />
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        <StudyAvailabilityNotice
          status={enrichmentStatus}
          isOnline={isOnline}
          onRetry={retryLiveRefresh}
          retryLoading={contentPackLoading}
          locale={bulletinLocale}
        />
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            isFocusMatched={isQuestionFocusMatched(q, currentFocusTopics)}
            onAnswer={(choice) => answerQuestion(q, choice)}
            locale={bulletinLocale}
          />
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
  availabilityNotice: {
    borderWidth: 1,
    borderColor: "#ffbd69",
    padding: 10,
    gap: 4,
  },
  availabilityTitle: {
    ...monoFontBold,
    color: "#ffbd69",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  availabilityCopy: {
    ...monoFont,
    color: "#86aa8b",
    fontSize: 10,
    lineHeight: 14,
  },
  retryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#00ff66",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
  },
  retryButtonText: {
    ...monoFontBold,
    color: "#00ff66",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  focusPanel: { borderWidth: 1, padding: 12, gap: 8 },
  focusLabel: { ...monoFontBold, fontSize: 10, letterSpacing: 1 },
  focusTheme: { ...monoFontBold, fontSize: 14 },
  focusItem: { gap: 3 },
  focusTopic: { ...monoFont, fontSize: 12 },
  focusWhy: { ...monoFont, fontSize: 10, lineHeight: 14 },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  subjectCopy: { flex: 1, gap: 4 },
  subjectLabel: { ...monoFontBold, fontSize: 14 },
  subjectFocus: { ...monoFont, fontSize: 10 },
  subjectMeta: { alignItems: "flex-end", gap: 4 },
  thisWeek: { ...monoFontBold, fontSize: 9, letterSpacing: 0.5 },
  subjectStats: { ...monoFont, fontSize: 11 },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  topic: { ...monoFontBold, flex: 1, fontSize: 10, letterSpacing: 1 },
  focusBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  focusBadgeText: { ...monoFontBold, fontSize: 8, letterSpacing: 0.5 },
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
