export interface AccentEntry {
  word: string;
  kana: string;
  pitch: number;
  pattern: string;
  type: "平板" | "頭高" | "中高" | "尾高";
  audio?: string;
}

export const accentData: AccentEntry[] = [
  { word: "桜", kana: "さくら", pitch: 2, pattern: "LHL", type: "中高" },
  { word: "東京", kana: "とうきょう", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "日本", kana: "にほん", pitch: 2, pattern: "LHL", type: "中高" },
  { word: "学校", kana: "がっこう", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "先生", kana: "せんせい", pitch: 3, pattern: "LHHL", type: "中高" },
  { word: "友達", kana: "ともだち", pitch: 2, pattern: "LHLL", type: "中高" },
  { word: "電話", kana: "でんわ", pitch: 1, pattern: "HLL", type: "頭高" },
  { word: "食べる", kana: "たべる", pitch: 2, pattern: "LHL", type: "中高" },
  { word: "行く", kana: "いく", pitch: 0, pattern: "LH", type: "平板" },
  { word: "来る", kana: "くる", pitch: 1, pattern: "HL", type: "頭高" },
  { word: "雨", kana: "あめ", pitch: 1, pattern: "HL", type: "頭高" },
  { word: "朝", kana: "あさ", pitch: 1, pattern: "HL", type: "頭高" },
  { word: "仕事", kana: "しごと", pitch: 0, pattern: "LHH", type: "平板" },
  { word: "家族", kana: "かぞく", pitch: 1, pattern: "HLL", type: "頭高" },
  { word: "学生", kana: "がくせい", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "勉強", kana: "べんきょう", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "料理", kana: "りょうり", pitch: 1, pattern: "HLLL", type: "頭高" },
  { word: "旅行", kana: "りょこう", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "会社", kana: "かいしゃ", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "新聞", kana: "しんぶん", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "問題", kana: "もんだい", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "準備", kana: "じゅんび", pitch: 1, pattern: "HLL", type: "頭高" },
  { word: "大切", kana: "たいせつ", pitch: 0, pattern: "LHHH", type: "平板" },
  { word: "文化", kana: "ぶんか", pitch: 1, pattern: "HLL", type: "頭高" },
  { word: "約束", kana: "やくそく", pitch: 0, pattern: "LHHH", type: "平板" },
];

export interface ShadowingVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  category: "Chuyện cổ tích" | "Tin tức" | "Anime" | "JLPT";
  isPremium: boolean;
}

export const shadowingVideos: ShadowingVideo[] = [
  { id: "1", title: "Momotarou - Chuyện cậu bé đào", thumbnail: "", duration: "3:25", views: 12450, level: "N5", category: "Chuyện cổ tích", isPremium: false },
  { id: "2", title: "Urashima Tarou - Câu chuyện cổ", thumbnail: "", duration: "4:10", views: 8900, level: "N5", category: "Chuyện cổ tích", isPremium: false },
  { id: "3", title: "NHK News Easy - Hôm nay", thumbnail: "", duration: "2:30", views: 5600, level: "N3", category: "Tin tức", isPremium: true },
  { id: "4", title: "JLPT N4 Đọc hiểu", thumbnail: "", duration: "5:00", views: 23100, level: "N4", category: "JLPT", isPremium: false },
  { id: "5", title: "Doraemon - Nobita và chiếc máy", thumbnail: "", duration: "6:45", views: 45000, level: "N4", category: "Anime", isPremium: true },
  { id: "6", title: "Detective Conan - Vụ án bí ẩn", thumbnail: "", duration: "7:20", views: 31200, level: "N3", category: "Anime", isPremium: true },
  { id: "7", title: "Cửa hàng tiện lợi buổi sáng", thumbnail: "", duration: "3:40", views: 18750, level: "N5", category: "JLPT", isPremium: false },
  { id: "8", title: "Kaguya-hime - Nàng công chúa mặt trăng", thumbnail: "", duration: "5:15", views: 15400, level: "N4", category: "Chuyện cổ tích", isPremium: false },
  { id: "9", title: "Issun-boshi - Cậu bé một tấc", thumbnail: "", duration: "4:35", views: 11200, level: "N4", category: "Chuyện cổ tích", isPremium: true },
  { id: "10", title: "NHK News Easy - Lễ hội mùa hè", thumbnail: "", duration: "3:05", views: 9200, level: "N3", category: "Tin tức", isPremium: false },
  { id: "11", title: "NHK News Easy - Công nghệ xanh", thumbnail: "", duration: "3:50", views: 7800, level: "N2", category: "Tin tức", isPremium: true },
  { id: "12", title: "Spirited Away - Lần đầu gặp Haku", thumbnail: "", duration: "5:28", views: 39700, level: "N3", category: "Anime", isPremium: true },
  { id: "13", title: "Kiki's Delivery Service - Ngày đầu làm việc", thumbnail: "", duration: "4:42", views: 26500, level: "N4", category: "Anime", isPremium: false },
  { id: "14", title: "JLPT N3 Nghe hiểu - Cuộc hẹn", thumbnail: "", duration: "6:10", views: 17300, level: "N3", category: "JLPT", isPremium: false },
  { id: "15", title: "JLPT N2 Nghe hiểu - Cuộc họp", thumbnail: "", duration: "7:05", views: 14100, level: "N2", category: "JLPT", isPremium: true },
  { id: "16", title: "Nhật ký Tokyo - Một ngày đi làm", thumbnail: "", duration: "5:50", views: 21800, level: "N2", category: "Tin tức", isPremium: false },
];

export interface KaiwaCard {
  id: string;
  topic: string;
  lesson: string;
  title: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  cardColor: string;
}

export const kaiwaCards: KaiwaCard[] = [
  { id: "1", topic: "Ở cửa hàng", lesson: "Bài 15", title: "Tôi cần gọi món", level: "N5", cardColor: "from-blue-400 to-indigo-500" },
  { id: "2", topic: "Đi bộ quanh khu phố", lesson: "Bài 16", title: "Xin hỏi đường đến ga", level: "N5", cardColor: "from-green-400 to-teal-500" },
  { id: "3", topic: "Ở bệnh viện", lesson: "Bài 17", title: "Tôi bị đau bụng", level: "N4", cardColor: "from-orange-400 to-red-500" },
  { id: "4", topic: "Tại trường học", lesson: "Bài 18", title: "Xin phép nghỉ học", level: "N4", cardColor: "from-purple-400 to-pink-500" },
  { id: "5", topic: "Phỏng vấn xin việc", lesson: "Bài 19", title: "Giới thiệu bản thân", level: "N3", cardColor: "from-yellow-400 to-orange-500" },
  { id: "6", topic: "Hội nghị công ty", lesson: "Bài 20", title: "Trình bày kế hoạch", level: "N2", cardColor: "from-cyan-400 to-blue-500" },
  { id: "7", topic: "Tại nhà ga", lesson: "Bài 21", title: "Tôi muốn đổi vé tàu", level: "N4", cardColor: "from-sky-400 to-blue-500" },
  { id: "8", topic: "Ở khách sạn", lesson: "Bài 22", title: "Tôi đã đặt một phòng", level: "N4", cardColor: "from-rose-400 to-pink-500" },
  { id: "9", topic: "Ở ngân hàng", lesson: "Bài 23", title: "Tôi muốn mở tài khoản", level: "N3", cardColor: "from-emerald-400 to-green-600" },
  { id: "10", topic: "Khám bệnh", lesson: "Bài 24", title: "Tôi cần gặp bác sĩ", level: "N3", cardColor: "from-red-400 to-orange-500" },
  { id: "11", topic: "Thuê nhà", lesson: "Bài 25", title: "Căn phòng này có gần ga không?", level: "N3", cardColor: "from-violet-400 to-purple-600" },
  { id: "12", topic: "Cuộc họp", lesson: "Bài 26", title: "Tôi xin trình bày ý kiến", level: "N2", cardColor: "from-indigo-400 to-blue-600" },
  { id: "13", topic: "Phỏng vấn", lesson: "Bài 27", title: "Điểm mạnh của tôi là gì", level: "N2", cardColor: "from-amber-400 to-orange-600" },
  { id: "14", topic: "Gọi điện công việc", lesson: "Bài 28", title: "Xin cho tôi gặp anh Tanaka", level: "N2", cardColor: "from-cyan-400 to-teal-600" },
  { id: "15", topic: "Thảo luận", lesson: "Bài 29", title: "Tôi đồng ý một phần với ý kiến đó", level: "N1", cardColor: "from-fuchsia-400 to-purple-600" },
  { id: "16", topic: "Thuyết trình", lesson: "Bài 30", title: "Hôm nay tôi sẽ phân tích xu hướng", level: "N1", cardColor: "from-slate-500 to-indigo-700" },
];
