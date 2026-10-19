import { router } from "expo-router";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { AppText } from "../../components/ui/AppText";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Screen } from "../../components/ui/Screen";
import { SURAH_ROW_HEIGHT, SurahListItem } from "../../components/quran/SurahListItem";
import { SOURCE_INFO } from "../../data/generated/source";
import { useSurahList } from "../../features/quran/hooks";
import { normalize } from "../../features/quran/normalize";
import { useTheme } from "../../theme/ThemeProvider";
import type { SurahMeta } from "../../types/quran";
import { formatCount, surahHref } from "../../utils/reference";

export default function SurahsScreen() {
  const { colors } = useTheme();
  const { data: surahs, loading, error, retry } = useSurahList();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    const normalizedQuery = normalize(deferred.trim());
    if (!normalizedQuery) return surahs;
    return surahs.filter((surah) => {
      const number = String(surah.number);
      return (
        number.startsWith(deferred.trim()) ||
        normalize(surah.name).includes(normalizedQuery) ||
        normalize(surah.arabicName).includes(normalizedQuery) ||
        normalize(surah.place).includes(normalizedQuery) ||
        normalize(surah.type).includes(normalizedQuery)
      );
    });
  }, [surahs, deferred]);

  const renderItem = ({ item }: ListRenderItemInfo<SurahMeta>) => (
    <SurahListItem
      surah={item}
      onPress={() => router.push(surahHref(item.number))}
    />
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="meta" tone="muted">
          The complete Mushaf
        </AppText>
        <AppText variant="display" style={styles.title}>
          Surahs
        </AppText>
        <AppText tone="muted" style={styles.subtitle}>
          {SOURCE_INFO.counts.surahs} surahs ·{" "}
          {formatCount(SOURCE_INFO.counts.verses)} numbered verses. Every text is
          the pinned source record.
        </AppText>

        <View
          style={[
            styles.search,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Icon name="search-outline" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filter by name, Arabic name or number"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.ink }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Filter the surah list"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear the surah filter"
              hitSlop={8}
            >
              <Icon name="close-circle" size={19} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="The surah list could not be loaded"
          body={error}
          actionLabel="Try again"
          onAction={retry}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: SURAH_ROW_HEIGHT,
            offset: SURAH_ROW_HEIGHT * index,
            index,
          })}
          initialNumToRender={14}
          maxToRenderPerBatch={16}
          windowSize={10}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No surahs match"
              body={
                query
                  ? "Try a shorter name, an Arabic name without diacritics, or a surah number."
                  : "The local surah metadata is empty."
              }
              actionLabel={query ? "Clear filter" : undefined}
              onAction={query ? () => setQuery("") : undefined}
            />
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <View style={styles.countRow}>
                <AppText variant="caption" tone="muted">
                  {query
                    ? `${filtered.length} of ${surahs?.length ?? 0} surahs`
                    : `${surahs?.length ?? 0} surahs`}
                </AppText>
              </View>
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  title: {
    marginTop: 2,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 540,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingBottom: 30,
  },
  countRow: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
});
