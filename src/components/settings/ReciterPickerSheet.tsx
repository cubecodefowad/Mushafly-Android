import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import {
  ACTIVE_GROUPS,
  RECITERS,
  reciterInfo,
} from "../../features/audio/reciters";
import type { ReciterId } from "../../types/quran";
import { AppText } from "../ui/AppText";
import { BottomSheet } from "../ui/BottomSheet";
import { Icon } from "../ui/Icon";

/**
 * The reciter list runs to dozens of editions, so it uses the same themed
 * search sheet as the translation picker. Entries are grouped by what they
 * recite, because a Warsh or translated recitation does not match the Hafs
 * text on the page.
 */
export function ReciterPickerSheet({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: ReciterId;
  onClose: () => void;
  onChange: (value: ReciterId) => void;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const current = reciterInfo(value);
  const total = RECITERS.length;

  useEffect(() => {
    if (!visible) return;
    // Focusing after the modal animation has started opens the keyboard on
    // Android; focusing during the mount is often swallowed.
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [visible]);

  const groups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) {
      return ACTIVE_GROUPS.map((group) => ({
        ...group,
        reciters: RECITERS.filter((reciter) => reciter.kind === group.kind),
      }));
    }
    return ACTIVE_GROUPS.map((group) => ({
      ...group,
      reciters: RECITERS.filter(
        (reciter) =>
          reciter.kind === group.kind &&
          `${reciter.name} ${reciter.bitrate ?? ""} ${reciter.language} ${group.label}`
            .toLocaleLowerCase()
            .includes(needle),
      ),
    })).filter((group) => group.reciters.length > 0);
  }, [query]);

  const matches = groups.reduce((sum, group) => sum + group.reciters.length, 0);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Reciter">
      <View
        style={[
          styles.search,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}
      >
        <Icon name="search-outline" size={17} color={colors.muted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Reciter, language or bitrate"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.ink }]}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search reciters"
        />
        {query ? (
          <Pressable
            onPress={() => setQuery("")}
            accessibilityRole="button"
            accessibilityLabel="Clear reciter search"
            hitSlop={8}
          >
            <Icon name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.current}>
        <AppText variant="caption" tone="muted">
          Listening to{" "}
          <AppText variant="label" style={{ color: colors.accent }}>
            {current.name}
          </AppText>
          {current.bitrate ? ` · ${current.bitrate}` : ""}
          {" · "}
          {current.source}
        </AppText>
      </View>

      <AppText variant="caption" tone="muted" style={styles.count}>
        {query.trim()
          ? `${matches} of ${total} recitations`
          : `${total} recitations, streamed per ayah`}
      </AppText>

      {groups.length === 0 ? (
        <AppText variant="caption" tone="muted" style={styles.empty}>
          No recitation matches “{query.trim()}”.
        </AppText>
      ) : null}

      {groups.map((group) => (
        <View key={group.kind} style={styles.group}>
          <AppText variant="meta" tone="muted" style={styles.groupLabel}>
            {group.label}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.groupNote}>
            {group.note}
          </AppText>
          {group.reciters.map((reciter) => {
            const selected = reciter.id === value;
            const detail = [
              reciter.bitrate,
              reciter.kind === "translation" ? reciter.language : null,
              reciter.folder ? reciter.source : "pinned source",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Pressable
                key={reciter.id}
                onPress={() => {
                  onChange(reciter.id);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${reciter.name}, ${detail}`}
                android_ripple={{ color: colors.highlight }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected
                      ? colors.accentSoft
                      : pressed
                        ? colors.surfaceMuted
                        : "transparent",
                  },
                ]}
              >
                <View style={styles.optionCopy}>
                  <AppText variant="label" style={styles.optionName}>
                    {reciter.name}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {detail}
                  </AppText>
                </View>
                {selected ? (
                  <Icon name="checkmark-circle" size={20} color={colors.accent} />
                ) : (
                  <View
                    style={[styles.dot, { borderColor: colors.border }]}
                    accessibilityElementsHidden
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      <AppText variant="caption" tone="muted" style={styles.footnote}>
        One file per ayah, requested only when you press play. The default
        streams from the pinned dataset; every other reciter streams from
        everyayah.com, which publishes no terms of its own. Changing reciter
        stops playback so the next verse starts from the source you chose.
      </AppText>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    paddingVertical: 0,
  },
  current: {
    marginTop: 10,
  },
  count: {
    marginTop: 4,
  },
  group: {
    marginTop: 18,
  },
  groupLabel: {
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  groupNote: {
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 17,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionName: {
    fontSize: 15,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  empty: {
    marginTop: 16,
  },
  footnote: {
    marginTop: 18,
    lineHeight: 18,
  },
});
