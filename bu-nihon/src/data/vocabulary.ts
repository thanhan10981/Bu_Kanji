export interface VocabItem {
  word: string;
  kana: string;
  meaning: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  partOfSpeech: string;
  example?: string;
}

export const vocabularyData: VocabItem[] = [
  { word: "é£Ÿã¹ã‚‹", kana: "ãŸã¹ã‚‹", meaning: "Ä‚n", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 2", example: "ã”é£¯ã‚’é£Ÿã¹ã‚‹" },
  { word: "é£²ã‚€", kana: "ã®ã‚€", meaning: "Uá»‘ng", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 1" },
  { word: "è¡Œã", kana: "ã„ã", meaning: "Äi", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 1" },
  { word: "æ¥ã‚‹", kana: "ãã‚‹", meaning: "Äáº¿n", level: "N5", partOfSpeech: "Äá»™ng tá»« báº¥t quy táº¯c" },
  { word: "è¦‹ã‚‹", kana: "ã¿ã‚‹", meaning: "Xem, nhÃ¬n", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 2" },
  { word: "èžã", kana: "ãã", meaning: "Nghe, há»i", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 1" },
  { word: "è©±ã™", kana: "ã¯ãªã™", meaning: "NÃ³i", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 1" },
  { word: "æ›¸ã", kana: "ã‹ã", meaning: "Viáº¿t", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 1" },
  { word: "èª­ã‚€", kana: "ã‚ˆã‚€", meaning: "Äá»c", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 1" },
  { word: "è²·ã†", kana: "ã‹ã†", meaning: "Mua", level: "N5", partOfSpeech: "Äá»™ng tá»« nhÃ³m 1" },
  { word: "å‹é”", kana: "ã¨ã‚‚ã ã¡", meaning: "Báº¡n bÃ¨", level: "N5", partOfSpeech: "Danh tá»«" },
  { word: "å­¦æ ¡", kana: "ãŒã£ã“ã†", meaning: "TrÆ°á»ng há»c", level: "N5", partOfSpeech: "Danh tá»«" },
  { word: "é›»è»Š", kana: "ã§ã‚“ã—ã‚ƒ", meaning: "TÃ u Ä‘iá»‡n", level: "N5", partOfSpeech: "Danh tá»«" },
  { word: "ãã‚Œã„", kana: "ãã‚Œã„", meaning: "Äáº¹p, sáº¡ch", level: "N5", partOfSpeech: "TÃ­nh tá»« ãª" },
  { word: "å¤§ãã„", kana: "ãŠãŠãã„", meaning: "To, lá»›n", level: "N5", partOfSpeech: "TÃ­nh tá»« ã„" },

  { word: "行く", kana: "いく", meaning: "Đi", level: "N5", partOfSpeech: "Động từ nhóm 1", example: "学校へ行きます。" },
  { word: "帰る", kana: "かえる", meaning: "Về nhà", level: "N5", partOfSpeech: "Động từ nhóm 1" },
  { word: "起きる", kana: "おきる", meaning: "Thức dậy", level: "N5", partOfSpeech: "Động từ nhóm 2" },
  { word: "寝る", kana: "ねる", meaning: "Ngủ", level: "N5", partOfSpeech: "Động từ nhóm 2" },
  { word: "勉強する", kana: "べんきょうする", meaning: "Học", level: "N5", partOfSpeech: "Động từ bất quy tắc" },
  { word: "天気", kana: "てんき", meaning: "Thời tiết", level: "N5", partOfSpeech: "Danh từ" },
  { word: "旅行", kana: "りょこう", meaning: "Du lịch", level: "N4", partOfSpeech: "Danh từ / động từ する" },
  { word: "準備", kana: "じゅんび", meaning: "Chuẩn bị", level: "N4", partOfSpeech: "Danh từ / động từ する" },
  { word: "連絡する", kana: "れんらくする", meaning: "Liên lạc", level: "N4", partOfSpeech: "Động từ bất quy tắc" },
  { word: "選ぶ", kana: "えらぶ", meaning: "Lựa chọn", level: "N4", partOfSpeech: "Động từ nhóm 1" },
  { word: "必要", kana: "ひつよう", meaning: "Cần thiết", level: "N4", partOfSpeech: "Tính từ な" },
  { word: "最近", kana: "さいきん", meaning: "Gần đây", level: "N4", partOfSpeech: "Trạng từ" },
  { word: "経験", kana: "けいけん", meaning: "Kinh nghiệm", level: "N3", partOfSpeech: "Danh từ / động từ する" },
  { word: "環境", kana: "かんきょう", meaning: "Môi trường", level: "N3", partOfSpeech: "Danh từ" },
  { word: "提案", kana: "ていあん", meaning: "Đề xuất", level: "N3", partOfSpeech: "Danh từ / động từ する" },
  { word: "増える", kana: "ふえる", meaning: "Tăng lên", level: "N3", partOfSpeech: "Động từ nhóm 2" },
  { word: "豊か", kana: "ゆたか", meaning: "Phong phú", level: "N3", partOfSpeech: "Tính từ な" },
  { word: "例えば", kana: "たとえば", meaning: "Ví dụ", level: "N3", partOfSpeech: "Trạng từ" },
  { word: "影響", kana: "えいきょう", meaning: "Ảnh hưởng", level: "N2", partOfSpeech: "Danh từ / động từ する" },
  { word: "責任", kana: "せきにん", meaning: "Trách nhiệm", level: "N2", partOfSpeech: "Danh từ" },
  { word: "解決", kana: "かいけつ", meaning: "Giải quyết", level: "N2", partOfSpeech: "Danh từ / động từ する" },
  { word: "維持する", kana: "いじする", meaning: "Duy trì", level: "N2", partOfSpeech: "Động từ bất quy tắc" },
  { word: "適切", kana: "てきせつ", meaning: "Phù hợp", level: "N2", partOfSpeech: "Tính từ な" },
  { word: "あらかじめ", kana: "あらかじめ", meaning: "Trước, từ trước", level: "N2", partOfSpeech: "Trạng từ" },
  { word: "概念", kana: "がいねん", meaning: "Khái niệm", level: "N1", partOfSpeech: "Danh từ" },
  { word: "傾向", kana: "けいこう", meaning: "Xu hướng", level: "N1", partOfSpeech: "Danh từ" },
  { word: "根拠", kana: "こんきょ", meaning: "Căn cứ", level: "N1", partOfSpeech: "Danh từ" },
  { word: "妥当", kana: "だとう", meaning: "Thỏa đáng", level: "N1", partOfSpeech: "Tính từ な" },
  { word: "伴う", kana: "ともなう", meaning: "Đi kèm", level: "N1", partOfSpeech: "Động từ nhóm 1" },
  { word: "おおむね", kana: "おおむね", meaning: "Nhìn chung", level: "N1", partOfSpeech: "Trạng từ" },
];

export const jlptLevelInfo = [
  { level: "N5", count: 1000, description: "CÆ¡ báº£n nháº¥t, tá»« vá»±ng hÃ ng ngÃ y", color: "#10b981" },
  { level: "N4", count: 1500, description: "Giao tiáº¿p cÆ¡ báº£n", color: "#3b82f6" },
  { level: "N3", count: 3000, description: "Trung cáº¥p, bÃ¡o chÃ­ Ä‘Æ¡n giáº£n", color: "#f59e0b" },
  { level: "N2", count: 6000, description: "NÃ¢ng cao, vÄƒn báº£n chÃ­nh thá»©c", color: "#ef4444" },
  { level: "N1", count: 10000, description: "ThÃ´ng tháº¡o hoÃ n toÃ n", color: "#8b5cf6" },
];

