import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import {
  Badge,
  Header,
  Panel,
  Prompt,
  Screen,
  Term,
  TermButton,
} from "@/components/Retro";
import { useColors } from "@/hooks/useColors";
import { isPackFresh, useSync } from "@/contexts/SyncContext";

function timeAgo(ts: number | null): string {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SyncScreen() {
  const colors = useColors();
  const {
    isOnline,
    checking,
    syncing,
    contentPack,
    lastSyncedAt,
    lastError,
    refreshConnection,
    syncNow,
  } = useSync();

  const online = isOnline === true;
  const statusColor =
    isOnline === null ? colors.mutedForeground : online ? colors.primary : colors.amber;
  const statusLabel =
    isOnline === null ? "UNKNOWN" : online ? "ONLINE" : "OFFLINE";

  const packFresh = contentPack ? isPackFresh(contentPack) : false;

  return (
    <Screen>
      <Header title="SYNC" subtitle="Reference content updates" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
      >
        <Panel style={{ gap: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather
                name={online ? "wifi" : "wifi-off"}
                size={18}
                color={statusColor}
              />
              <Term bold glow size={16} color={statusColor}>
                {statusLabel}
              </Term>
            </View>
            {checking ? <ActivityIndicator size="small" color={statusColor} /> : null}
          </View>
          <Term dim size={12}>
            The Academy runs fully offline. Connect to refresh weekly reference
            content and enable AI-enriched flavor text.
          </Term>
          <TermButton
            label="Check connection"
            variant="ghost"
            onPress={() => void refreshConnection()}
            loading={checking}
          />
        </Panel>

        <View>
          <Prompt label="Update" />
          <Panel style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Term dim size={13}>
                Last synced
              </Term>
              <Term bold size={13}>
                {timeAgo(lastSyncedAt)}
              </Term>
            </View>
            <TermButton
              label={online ? "Sync now" : "Sync (offline)"}
              onPress={() => void syncNow()}
              disabled={!online}
              loading={syncing}
              testID="sync-now"
            />
            {lastError ? (
              <Term size={12} color={colors.destructive}>
                {lastError}
              </Term>
            ) : null}
          </Panel>
        </View>

        <View>
          <Prompt label="Content pack" />
          {contentPack ? (
            <Panel style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Term bold size={13} color={colors.accent}>
                  {contentPack.version}
                </Term>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Badge
                    label={contentPack.generatedBy === "gpt" ? "AI" : "DETERMINISTIC"}
                    color={colors.mutedForeground}
                  />
                  <Badge
                    label={packFresh ? "FRESH" : "STALE"}
                    color={packFresh ? colors.primary : colors.amber}
                  />
                </View>
              </View>

              <Term bold size={14}>
                {contentPack.weeklyTheme}
              </Term>
              <Term dim size={12}>
                {contentPack.themeContext}
              </Term>

              {contentPack.gedFocusAreas?.length ? (
                <View
                  style={{
                    gap: 8,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingTop: 10,
                  }}
                >
                  <Term dim size={11}>
                    THIS WEEK&apos;S GED FOCUS
                  </Term>
                  {contentPack.gedFocusAreas.map((f, i) => (
                    <View key={`${f.subject}-${i}`}>
                      <Term size={13} color={colors.foreground}>
                        {`${f.subject} — ${f.topic}`}
                      </Term>
                      <Term dim size={11}>
                        {f.whyNow}
                      </Term>
                    </View>
                  ))}
                </View>
              ) : null}

              {contentPack.activeEvents?.length ? (
                <Term dim size={11}>
                  {`${contentPack.activeEvents.length} active world events · ${contentPack.npcMoodShifts?.length ?? 0} NPC mood shifts`}
                </Term>
              ) : null}
            </Panel>
          ) : (
            <Panel style={{ alignItems: "center", paddingVertical: 28, gap: 10 }}>
              <Feather name="download-cloud" size={26} color={colors.mutedForeground} />
              <Term dim size={12} style={{ textAlign: "center" }}>
                No content pack cached yet. Sync while online to download this
                week&apos;s reference content.
              </Term>
            </Panel>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
