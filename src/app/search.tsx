import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { AppHeader } from "../components/ui/AppHeader";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { Screen } from "../components/ui/Screen";
import { SearchResultItem } from "../components/search/SearchResultItem";
import { useSearch } from "../features/search/useSearch";
import { useSettings } from "../features/settings/SettingsProvider";
import { useTheme } from "../theme/ThemeProvider";
import type { SearchResult } from "../types/quran";
import { surahHref } from "../utils/reference";

export default function SearchScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const search = useSearch(query, settings.translation);
  const trimmed = query.trim();

  const headerStatus =
    trimmed.length < 2
      ? null
      : search.status === "loading"
        ? "Searching the local text…"
        : search.status === "ready"
          ? `${search.results.length} result${search.results.length === 1 ? "" : "s"}${search.results.length >= 120 ? " (first 120)" : ""}`
          : null;

  return (
    <Screen>
      <AppHeader title="Search" bordered={false} />
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Icon name="search-outline" size={19} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Arabic or English"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.ink }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search the Quran text and English translation"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <Icon name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        {headerStatus ? (
          <View style={styles.statusRow}>
            {search.status === "loading" ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : null}
            <AppText variant="caption" tone="muted">
              {headerStatus}
            </AppText>
          </View>
        ) : null}
      </View>

      <FlatList
        data={search.results}
        keyExtractor={(item) => `${item.surahNumber}:${item.verseNumber}`}
        renderItem={({ item }: ListRenderItemInfo<SearchResult>) => (
          <SearchResultItem
            result={item}
            onPress={() => router.push(surahHref(item.surahNumber, item.verseNumber))}
          />
        )}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          trimmed.length < 2 ? (
            <View style={styles.intro}>
              <Card>
                <AppText variant="heading">Search the whole Mushaf</AppText>
                <AppText tone="muted" style={styles.introText}>
                  Search the Arabic source text and the English Itani translation.
                  Arabic matching ignores diacritics, vowel marks and Quranic
                  annotation signs only in the search copy; the reader always
                  displays the exact source string.
                </AppText>
                <AppText variant="meta" tone="muted" style={styles.suggestLabel}>
                  Try
                </AppText>
                <View style={styles.suggestions}>
                  {["mercy", "light", "الرحمن"].map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      onPress={() => setQuery(suggestion)}
                      accessibilityRole="button"
                      accessibilityLabel={`Search for ${suggestion}`}
                      style={[
                        styles.suggestion,
                        { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                      ]}
                    >
                      <AppText variant="label">{suggestion}</AppText>
                    </Pressable>
                  ))}
                </View>
              </Card>
              <AppText variant="caption" tone="muted" style={styles.normalization}>
                Type at least two characters. English matching is case-insensitive
                and ignores accent marks and punctuation. Transliteration search is
                not available because the pinned source supplies no transliteration
                field.
              </AppText>
            </View>
          ) : search.status === "error" ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Search could not be completed"
              body={search.error ?? "The local search query failed."}
              actionLabel="Try again"
              onAction={search.retry}
            />
          ) : search.status === "ready" ? (
            <EmptyState
              icon="search-outline"
              title="No matches"
              body={`Nothing in the Arabic text or English translation matches “${trimmed}”. Try a shorter word or a different spelling.`}
            />
          ) : (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontSize: 15,
    paddingVertical: 0,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 30,
    paddingTop: 6,
  },
  list: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  intro: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  introText: {
    marginTop: 8,
  },
  suggestLabel: {
    marginTop: 18,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  suggestion: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  normalization: {
    marginTop: 16,
    lineHeight: 18,
  },
  center: {
    paddingTop: 60,
    alignItems: "center",
  },
});
