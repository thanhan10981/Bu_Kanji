import { z } from "zod";

export const kanjiSearchSchema = z.object({
  query: z.string().min(0).max(100),
  level: z.enum(["all", "N5", "N4", "N3", "N2", "N1", "bộ thủ"]).default("all"),
});

export const vocabSearchSchema = z.object({
  query: z.string().min(0).max(200),
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
});

export const accentSearchSchema = z.object({
  query: z.string().min(1, "Vui lòng nhập từ cần tra").max(50),
});

export const fileGeneratorSchema = z.object({
  tab: z.enum(["kanji", "vocabulary"]),
  searchInput: z.string().max(200),
  bulkInput: z.string().max(5000),
  exportFormat: z.enum(["pdf", "png", "svg"]),
});

export type KanjiSearchInput = z.infer<typeof kanjiSearchSchema>;
export type VocabSearchInput = z.infer<typeof vocabSearchSchema>;
export type AccentSearchInput = z.infer<typeof accentSearchSchema>;
export type FileGeneratorInput = z.infer<typeof fileGeneratorSchema>;
