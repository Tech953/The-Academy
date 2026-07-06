import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import {
  Badge,
  Header,
  Panel,
  Prompt,
  Screen,
  Term,
  TermButton,
  FONT_REGULAR,
} from "@/components/Retro";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { generateQuizSet } from "@/lib/offlineContentEngine";
import type { GEDSubjectKey, StudyQuestion } from "@/lib/studyTemplates";

const SUBJECTS: { key: GEDSubjectKey; label: string }[] = [
  { key: "math", label: "Mathematics" },
  { key: "language_arts", label: "Language Arts" },
  { key: "science", label: "Science" },
  { key: "social_studies", label: "Social Studies" },
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function StudyScreen() {
  const colors = useColors();
  const { recordQuizResult } = useGame();

  const [subject, setSubject] = useState<GEDSubjectKey>("math");
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const startQuiz = (subj: GEDSubjectKey) => {
    const nextRound = round + 1;
    const set = generateQuizSet(subj, `quiz-${subj}-${nextRound}`, 5);
    setSubject(subj);
    setRound(nextRound);
    setQuestions(set.questions);
    setAnswers({});
    setSubmitted(false);
  };

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce(
      (acc, q) =>
        acc + (normalize(answers[q.id] ?? "") === normalize(q.answer) ? 1 : 0),
      0,
    );
  }, [submitted, questions, answers]);

  const submit = () => {
    setSubmitted(true);
    const correct = questions.reduce(
      (acc, q) =>
        acc + (normalize(answers[q.id] ?? "") === normalize(q.answer) ? 1 : 0),
      0,
    );
    void recordQuizResult(correct, questions.length);
  };

  const allAnswered = questions.every((q) => (answers[q.id] ?? "").length > 0);

  return (
    <Screen>
      <Header
        title="GED STUDY"
        subtitle="Offline-first practice"
        right={
          <Badge label="OFFLINE ENGINE" color={colors.amber} />
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Prompt label="Subject" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {SUBJECTS.map((s) => {
              const on = s.key === subject;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => startQuiz(s.key)}
                  style={{
                    borderColor: on ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: colors.radius,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    backgroundColor: on ? colors.secondary : "transparent",
                  }}
                >
                  <Term
                    size={12}
                    bold={on}
                    color={on ? colors.primary : colors.mutedForeground}
                  >
                    {s.label}
                  </Term>
                </Pressable>
              );
            })}
          </View>
        </View>

        {questions.length === 0 ? (
          <Panel style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
            <Feather name="book-open" size={28} color={colors.mutedForeground} />
            <Term dim style={{ textAlign: "center" }}>
              Select a subject to generate a practice set. Works fully offline.
            </Term>
          </Panel>
        ) : (
          <>
            {questions.map((q, i) => {
              const chosen = answers[q.id] ?? "";
              const correct = normalize(chosen) === normalize(q.answer);
              return (
                <Panel key={q.id} style={{ gap: 10 }}>
                  <Term dim size={11}>
                    {`Q${i + 1} · ${q.topic}`}
                  </Term>
                  <Term size={14}>{q.question}</Term>

                  {q.choices && q.choices.length > 0 ? (
                    <View style={{ gap: 8 }}>
                      {q.choices.map((choice) => {
                        const picked = chosen === choice;
                        const isAnswer =
                          normalize(choice) === normalize(q.answer);
                        let borderColor = colors.border;
                        let textColor = colors.foreground;
                        if (submitted && isAnswer) {
                          borderColor = colors.primary;
                          textColor = colors.primary;
                        } else if (submitted && picked && !isAnswer) {
                          borderColor = colors.destructive;
                          textColor = colors.destructive;
                        } else if (picked) {
                          borderColor = colors.accent;
                          textColor = colors.accent;
                        }
                        return (
                          <Pressable
                            key={choice}
                            disabled={submitted}
                            onPress={() =>
                              setAnswers((a) => ({ ...a, [q.id]: choice }))
                            }
                            style={{
                              borderColor,
                              borderWidth: 1,
                              borderRadius: colors.radius,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              backgroundColor: picked
                                ? colors.secondary
                                : "transparent",
                            }}
                          >
                            <Term size={13} color={textColor}>
                              {choice}
                            </Term>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <TextInput
                      value={chosen}
                      editable={!submitted}
                      onChangeText={(t) =>
                        setAnswers((a) => ({ ...a, [q.id]: t }))
                      }
                      placeholder="type your answer..."
                      placeholderTextColor={colors.mutedForeground}
                      style={{
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: colors.radius,
                        color: colors.foreground,
                        fontFamily: FONT_REGULAR,
                        fontSize: 14,
                        paddingHorizontal: 12,
                        paddingVertical: Platform.OS === "ios" ? 12 : 8,
                        backgroundColor: colors.input,
                      }}
                      autoCapitalize="none"
                    />
                  )}

                  {submitted ? (
                    <View
                      style={{
                        gap: 6,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
                        paddingTop: 8,
                      }}
                    >
                      <Term
                        bold
                        size={12}
                        color={correct ? colors.primary : colors.destructive}
                      >
                        {correct ? "CORRECT" : `ANSWER: ${q.answer}`}
                      </Term>
                      <Term dim size={12}>
                        {q.explanation}
                      </Term>
                    </View>
                  ) : null}
                </Panel>
              );
            })}

            {submitted ? (
              <Panel
                style={{
                  borderColor: colors.accent,
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Term bold glow size={22} color={colors.accent}>
                  {`${score} / ${questions.length}`}
                </Term>
                <Term dim size={12}>
                  {`${Math.round((score / questions.length) * 100)}% correct`}
                </Term>
                <TermButton
                  label="New quiz"
                  onPress={() => startQuiz(subject)}
                />
              </Panel>
            ) : (
              <TermButton
                label="Submit answers"
                onPress={submit}
                disabled={!allAnswered}
                testID="submit-quiz"
              />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
