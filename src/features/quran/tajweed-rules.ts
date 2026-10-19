/**
 * Interface metadata for the 18 rule identifiers that occur in quranjson's
 * tajweed dataset. Descriptions are conventional teaching labels, not Quranic
 * text and not generated annotations. Colors are presentation only.
 */
export type TajweedRuleInfo = {
  label: string;
  description: string;
  light: string;
  dark: string;
};

export const TAJWEED_RULES: Record<string, TajweedRuleInfo> = {
  hamzat_wasl: {
    label: "Hamzat al-Wasl",
    description: "Connecting hamzah, normally elided when reading continues.",
    light: "#7B4FA0",
    dark: "#C9A7F0",
  },
  madd_2: {
    label: "Madd · 2 counts",
    description: "Natural elongation held for two counts.",
    light: "#1E5FA8",
    dark: "#8FB8EC",
  },
  madd_246: {
    label: "Madd · 2, 4 or 6",
    description: "Elongation whose length depends on the reading context.",
    light: "#176F73",
    dark: "#79C9CC",
  },
  madd_6: {
    label: "Madd · 6 counts",
    description: "Necessary elongation held for six counts.",
    light: "#A32E3C",
    dark: "#F08A96",
  },
  madd_munfasil: {
    label: "Madd Munfasil",
    description: "Separated elongation across a word boundary.",
    light: "#2E6B3E",
    dark: "#8FCB9A",
  },
  madd_muttasil: {
    label: "Madd Muttasil",
    description: "Connected elongation within a single word.",
    light: "#7A4A1E",
    dark: "#D6A66F",
  },
  ikhfa: {
    label: "Ikhfa",
    description: "Partial nasal concealment of a noon or tanween.",
    light: "#A14A22",
    dark: "#E8A47D",
  },
  ikhfa_shafawi: {
    label: "Ikhfa Shafawi",
    description: "Labial concealment of a meem before baa.",
    light: "#7A5B12",
    dark: "#D9C06E",
  },
  ghunnah: {
    label: "Ghunnah",
    description: "Nasal resonance on a doubled noon or meem.",
    light: "#8B3A62",
    dark: "#E69AB8",
  },
  idghaam_ghunnah: {
    label: "Idghaam with Ghunnah",
    description: "Merging with nasal resonance.",
    light: "#4A6B1A",
    dark: "#B5CE7A",
  },
  idghaam_no_ghunnah: {
    label: "Idghaam without Ghunnah",
    description: "Merging without nasal resonance.",
    light: "#3D6B52",
    dark: "#8FC7A8",
  },
  idghaam_shafawi: {
    label: "Idghaam Shafawi",
    description: "Labial merging of a meem.",
    light: "#3B5F82",
    dark: "#9FBEDC",
  },
  idghaam_mutajanisayn: {
    label: "Idghaam Mutajanisayn",
    description: "Merging of letters that share a point of articulation.",
    light: "#66508C",
    dark: "#C3AFE3",
  },
  idghaam_mutaqaribayn: {
    label: "Idghaam Mutaqaribayn",
    description: "Merging of letters with nearby articulation points.",
    light: "#8A4F6B",
    dark: "#DFA2BF",
  },
  iqlab: {
    label: "Iqlab",
    description: "Conversion of noon or tanween to a meem sound.",
    light: "#A63A5B",
    dark: "#F093AC",
  },
  qalqalah: {
    label: "Qalqalah",
    description: "Echoing articulation of a quiet letter.",
    light: "#A3402E",
    dark: "#F09884",
  },
  lam_shamsiyyah: {
    label: "Lam Shamsiyyah",
    description: "Assimilated solar lam, not pronounced.",
    light: "#615846",
    dark: "#C0B49A",
  },
  silent: {
    label: "Silent",
    description: "A letter the source marks as not pronounced.",
    light: "#6B6E66",
    dark: "#A9ACA3",
  },
};

export function ruleInfo(rule: string): TajweedRuleInfo {
  return (
    TAJWEED_RULES[rule] ?? {
      label: rule,
      description: "Rule identifier supplied by the source dataset.",
      light: "var(--text-secondary)",
      dark: "var(--text-secondary)",
    }
  );
}
