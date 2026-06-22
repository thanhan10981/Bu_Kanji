"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { kanjiData, type KanjiItem } from "@/data/kanji";
import KanjiStrokeOrder from "@/components/KanjiStrokeOrder";
import { SpeakButton } from "@/hooks/useJapaneseTTS";
import {
  ArrowLeft, Volume2, Pen, CreditCard, BookOpen, Sparkles, ChevronRight,
} from "lucide-react";

/* ─────────────────── LEVEL META ─────────────────── */
const LEVEL_META: Record<string, { color: string; bg: string; border: string; glow: string; label: string }> = {
  N5: { color: "#059669", bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)", border: "#6ee7b7", glow: "#10b98130", label: "Cơ bản" },
  N4: { color: "#2563eb", bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", border: "#93c5fd", glow: "#3b82f630", label: "Sơ cấp" },
  N3: { color: "#d97706", bg: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "#fcd34d", glow: "#f59e0b30", label: "Trung cấp" },
  N2: { color: "#dc2626", bg: "linear-gradient(135deg,#fee2e2,#fecaca)", border: "#fca5a5", glow: "#ef444430", label: "Cao cấp" },
  N1: { color: "#7c3aed", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", border: "#c4b5fd", glow: "#8b5cf630", label: "Nâng cao" },
};

/* ─────────────────── COMPOUND DATA ─────────────────── */
const KANJI_COMPOUNDS: Record<string, Array<{ word: string; reading: string; meaning: string }>> = {
  "日": [{word:"日本",reading:"にほん",meaning:"Nhật Bản"},{word:"毎日",reading:"まいにち",meaning:"mỗi ngày"},{word:"今日",reading:"きょう",meaning:"hôm nay"},{word:"日曜日",reading:"にちようび",meaning:"Chủ Nhật"}],
  "本": [{word:"日本",reading:"にほん",meaning:"Nhật Bản"},{word:"本当",reading:"ほんとう",meaning:"thật sự"},{word:"本屋",reading:"ほんや",meaning:"tiệm sách"},{word:"基本",reading:"きほん",meaning:"cơ bản"}],
  "人": [{word:"日本人",reading:"にほんじん",meaning:"người Nhật"},{word:"外国人",reading:"がいこくじん",meaning:"ngoại quốc nhân"},{word:"人間",reading:"にんげん",meaning:"con người"},{word:"人口",reading:"じんこう",meaning:"dân số"}],
  "山": [{word:"富士山",reading:"ふじさん",meaning:"núi Phú Sĩ"},{word:"登山",reading:"とざん",meaning:"leo núi"},{word:"火山",reading:"かざん",meaning:"núi lửa"},{word:"山道",reading:"やまみち",meaning:"đường núi"}],
  "川": [{word:"小川",reading:"おがわ",meaning:"suối nhỏ"},{word:"川上",reading:"かわかみ",meaning:"thượng lưu"},{word:"川下",reading:"かわしも",meaning:"hạ lưu"}],
  "火": [{word:"花火",reading:"はなび",meaning:"pháo hoa"},{word:"火山",reading:"かざん",meaning:"núi lửa"},{word:"火事",reading:"かじ",meaning:"đám cháy"},{word:"火曜日",reading:"かようび",meaning:"Thứ Ba"}],
  "水": [{word:"水道",reading:"すいどう",meaning:"đường ống nước"},{word:"水曜日",reading:"すいようび",meaning:"Thứ Tư"},{word:"洪水",reading:"こうずい",meaning:"lũ lụt"},{word:"水泳",reading:"すいえい",meaning:"bơi lội"}],
  "木": [{word:"木曜日",reading:"もくようび",meaning:"Thứ Năm"},{word:"木材",reading:"もくざい",meaning:"gỗ"},{word:"大木",reading:"たいぼく",meaning:"cây cổ thụ"},{word:"植木",reading:"うえき",meaning:"cây cảnh"}],
  "金": [{word:"金曜日",reading:"きんようび",meaning:"Thứ Sáu"},{word:"金魚",reading:"きんぎょ",meaning:"cá vàng"},{word:"黄金",reading:"おうごん",meaning:"vàng ròng"},{word:"金属",reading:"きんぞく",meaning:"kim loại"}],
  "土": [{word:"土曜日",reading:"どようび",meaning:"Thứ Bảy"},{word:"土地",reading:"とち",meaning:"đất đai"},{word:"土台",reading:"どだい",meaning:"nền móng"},{word:"粘土",reading:"ねんど",meaning:"đất sét"}],
  "口": [{word:"出口",reading:"でぐち",meaning:"lối ra"},{word:"入口",reading:"いりぐち",meaning:"lối vào"},{word:"人口",reading:"じんこう",meaning:"dân số"},{word:"口頭",reading:"こうとう",meaning:"miệng"}],
  "目": [{word:"目標",reading:"もくひょう",meaning:"mục tiêu"},{word:"注目",reading:"ちゅうもく",meaning:"chú ý"},{word:"目的",reading:"もくてき",meaning:"mục đích"},{word:"真面目",reading:"まじめ",meaning:"nghiêm túc"}],
  "手": [{word:"手紙",reading:"てがみ",meaning:"thư"},{word:"上手",reading:"じょうず",meaning:"giỏi"},{word:"下手",reading:"へた",meaning:"kém"},{word:"握手",reading:"あくしゅ",meaning:"bắt tay"}],
  "足": [{word:"足跡",reading:"あしあと",meaning:"dấu chân"},{word:"不足",reading:"ふそく",meaning:"thiếu"},{word:"満足",reading:"まんぞく",meaning:"thỏa mãn"},{word:"遠足",reading:"えんそく",meaning:"dã ngoại"}],
  "気": [{word:"気持ち",reading:"きもち",meaning:"cảm giác"},{word:"天気",reading:"てんき",meaning:"thời tiết"},{word:"元気",reading:"げんき",meaning:"khỏe mạnh"},{word:"電気",reading:"でんき",meaning:"điện"}],
  "行": [{word:"旅行",reading:"りょこう",meaning:"du lịch"},{word:"銀行",reading:"ぎんこう",meaning:"ngân hàng"},{word:"行動",reading:"こうどう",meaning:"hành động"},{word:"行列",reading:"ぎょうれつ",meaning:"hàng dài"}],
  "食": [{word:"食事",reading:"しょくじ",meaning:"bữa ăn"},{word:"食堂",reading:"しょくどう",meaning:"căn-tin"},{word:"食料",reading:"しょくりょう",meaning:"thực phẩm"},{word:"和食",reading:"わしょく",meaning:"ẩm thực Nhật"}],
  "学": [{word:"学校",reading:"がっこう",meaning:"trường học"},{word:"大学",reading:"だいがく",meaning:"đại học"},{word:"学生",reading:"がくせい",meaning:"học sinh"},{word:"留学",reading:"りゅうがく",meaning:"du học"}],
  "先": [{word:"先生",reading:"せんせい",meaning:"giáo viên"},{word:"先月",reading:"せんげつ",meaning:"tháng trước"},{word:"先週",reading:"せんしゅう",meaning:"tuần trước"},{word:"先輩",reading:"せんぱい",meaning:"đàn anh"}],
  "生": [{word:"先生",reading:"せんせい",meaning:"giáo viên"},{word:"学生",reading:"がくせい",meaning:"học sinh"},{word:"生活",reading:"せいかつ",meaning:"cuộc sống"},{word:"誕生日",reading:"たんじょうび",meaning:"sinh nhật"}],
  "語": [{word:"日本語",reading:"にほんご",meaning:"tiếng Nhật"},{word:"英語",reading:"えいご",meaning:"tiếng Anh"},{word:"外国語",reading:"がいこくご",meaning:"ngoại ngữ"},{word:"語学",reading:"ごがく",meaning:"ngôn ngữ học"}],
  "電": [{word:"電話",reading:"でんわ",meaning:"điện thoại"},{word:"電車",reading:"でんしゃ",meaning:"tàu điện"},{word:"電気",reading:"でんき",meaning:"điện"},{word:"電子",reading:"でんし",meaning:"điện tử"}],
  "車": [{word:"電車",reading:"でんしゃ",meaning:"tàu điện"},{word:"自動車",reading:"じどうしゃ",meaning:"ô tô"},{word:"自転車",reading:"じてんしゃ",meaning:"xe đạp"},{word:"駐車場",reading:"ちゅうしゃじょう",meaning:"bãi đỗ xe"}],
  "国": [{word:"外国",reading:"がいこく",meaning:"nước ngoài"},{word:"中国",reading:"ちゅうごく",meaning:"Trung Quốc"},{word:"国語",reading:"こくご",meaning:"ngôn ngữ"},{word:"国際",reading:"こくさい",meaning:"quốc tế"}],
  "帰": [{word:"帰国",reading:"きこく",meaning:"về nước"},{word:"帰宅",reading:"きたく",meaning:"về nhà"},{word:"帰省",reading:"きせい",meaning:"về quê"},{word:"帰還",reading:"きかん",meaning:"trở về"}],
  "見": [{word:"見学",reading:"けんがく",meaning:"tham quan"},{word:"見物",reading:"けんぶつ",meaning:"ngắm nhìn"},{word:"発見",reading:"はっけん",meaning:"phát hiện"},{word:"意見",reading:"いけん",meaning:"ý kiến"}],
  "来": [{word:"来月",reading:"らいげつ",meaning:"tháng sau"},{word:"来週",reading:"らいしゅう",meaning:"tuần sau"},{word:"来年",reading:"らいねん",meaning:"năm sau"},{word:"出来る",reading:"できる",meaning:"có thể"}],
  "聞": [{word:"新聞",reading:"しんぶん",meaning:"báo"},{word:"聞こえる",reading:"きこえる",meaning:"nghe thấy"},{word:"質問",reading:"しつもん",meaning:"câu hỏi"}],
  "時": [{word:"時間",reading:"じかん",meaning:"thời gian"},{word:"時計",reading:"とけい",meaning:"đồng hồ"},{word:"同時",reading:"どうじ",meaning:"đồng thời"},{word:"時代",reading:"じだい",meaning:"thời đại"}],
  "間": [{word:"時間",reading:"じかん",meaning:"thời gian"},{word:"人間",reading:"にんげん",meaning:"con người"},{word:"空間",reading:"くうかん",meaning:"không gian"},{word:"週間",reading:"しゅうかん",meaning:"tuần"}],
  "大": [{word:"大学",reading:"だいがく",meaning:"đại học"},{word:"大人",reading:"おとな",meaning:"người lớn"},{word:"大事",reading:"だいじ",meaning:"quan trọng"},{word:"偉大",reading:"いだい",meaning:"vĩ đại"}],
  "小": [{word:"小学校",reading:"しょうがっこう",meaning:"tiểu học"},{word:"小説",reading:"しょうせつ",meaning:"tiểu thuyết"},{word:"小川",reading:"おがわ",meaning:"suối nhỏ"},{word:"小鳥",reading:"ことり",meaning:"chim nhỏ"}],
  "年": [{word:"来年",reading:"らいねん",meaning:"năm sau"},{word:"去年",reading:"きょねん",meaning:"năm ngoái"},{word:"今年",reading:"ことし",meaning:"năm nay"},{word:"毎年",reading:"まいとし",meaning:"mỗi năm"}],
  "月": [{word:"今月",reading:"こんげつ",meaning:"tháng này"},{word:"先月",reading:"せんげつ",meaning:"tháng trước"},{word:"来月",reading:"らいげつ",meaning:"tháng sau"},{word:"月曜日",reading:"げつようび",meaning:"Thứ Hai"}],
  "週": [{word:"今週",reading:"こんしゅう",meaning:"tuần này"},{word:"先週",reading:"せんしゅう",meaning:"tuần trước"},{word:"来週",reading:"らいしゅう",meaning:"tuần sau"},{word:"週末",reading:"しゅうまつ",meaning:"cuối tuần"}],
  "話": [{word:"電話",reading:"でんわ",meaning:"điện thoại"},{word:"会話",reading:"かいわ",meaning:"hội thoại"},{word:"話題",reading:"わだい",meaning:"chủ đề"},{word:"童話",reading:"どうわ",meaning:"truyện cổ tích"}],
  "書": [{word:"図書館",reading:"としょかん",meaning:"thư viện"},{word:"教科書",reading:"きょうかしょ",meaning:"sách giáo khoa"},{word:"書類",reading:"しょるい",meaning:"tài liệu"},{word:"辞書",reading:"じしょ",meaning:"từ điển"}],
  "読": [{word:"読書",reading:"どくしょ",meaning:"đọc sách"},{word:"読者",reading:"どくしゃ",meaning:"độc giả"},{word:"音読み",reading:"おんよみ",meaning:"âm On"},{word:"黙読",reading:"もくどく",meaning:"đọc thầm"}],
  "天": [{word:"天気",reading:"てんき",meaning:"thời tiết"},{word:"天才",reading:"てんさい",meaning:"thiên tài"},{word:"天国",reading:"てんごく",meaning:"thiên đường"},{word:"天井",reading:"てんじょう",meaning:"trần nhà"}],
  "空": [{word:"空港",reading:"くうこう",meaning:"sân bay"},{word:"空間",reading:"くうかん",meaning:"không gian"},{word:"青空",reading:"あおぞら",meaning:"bầu trời xanh"},{word:"空気",reading:"くうき",meaning:"không khí"}],
};

/* ─────────────────── MINA / TANGO VOCAB DATA ─────────────────── */
type VocabEntry = { word: string; reading: string; meaning: string; sino: string; source: "Mina" | "Tango"; lesson?: number };
const MINA_TANGO_VOCAB: Record<string, VocabEntry[]> = {
  "電": [
    { word:"電気",    reading:"でんき",       meaning:"điện, đèn điện",       sino:"ĐIỆN KHÍ",         source:"Mina",  lesson:7  },
    { word:"電話",    reading:"でんわ",       meaning:"điện thoại",           sino:"ĐIỆN THOẠI",       source:"Mina",  lesson:6  },
    { word:"電車",    reading:"でんしゃ",     meaning:"tàu điện",             sino:"ĐIỆN XA",          source:"Mina",  lesson:7  },
    { word:"電話番号",reading:"でんわばんごう",meaning:"số điện thoại",        sino:"ĐIỆN THOẠI PHIÊN HIỆU", source:"Mina",lesson:4},
    { word:"電池",    reading:"でんち",       meaning:"pin",                  sino:"ĐIỆN TRỪ",         source:"Tango", lesson:20 },
    { word:"電子辞書",reading:"でんしじしょ", meaning:"từ điển điện tử",      sino:"ĐIỆN TỬ TỪ THƯ",  source:"Tango", lesson:15 },
    { word:"電源",    reading:"でんげん",     meaning:"nguồn điện, công tắc",sino:"ĐIỆN NGUYÊN",     source:"Tango", lesson:28 },
  ],
  "日": [
    { word:"日曜日",  reading:"にちようび",   meaning:"Chủ nhật",            sino:"NHẬT DIỆU NHẬT",  source:"Mina",  lesson:5  },
    { word:"毎日",    reading:"まいにち",     meaning:"mỗi ngày",            sino:"MỖI NHẬT",        source:"Mina",  lesson:6  },
    { word:"今日",    reading:"きょう",       meaning:"hôm nay",             sino:"KIM NHẬT",        source:"Mina",  lesson:5  },
    { word:"日本語",  reading:"にほんご",     meaning:"tiếng Nhật",          sino:"NHẬT BẢN NGỮ",   source:"Mina",  lesson:1  },
    { word:"先日",    reading:"せんじつ",     meaning:"hôm trước",           sino:"TIÊN NHẬT",       source:"Tango", lesson:23 },
  ],
  "本": [
    { word:"日本",    reading:"にほん",       meaning:"Nhật Bản",            sino:"NHẬT BẢN",        source:"Mina",  lesson:1  },
    { word:"本",      reading:"ほん",         meaning:"sách, quyển",         sino:"BẢN",             source:"Mina",  lesson:2  },
    { word:"本当に",  reading:"ほんとうに",   meaning:"thật sự",             sino:"BẢN ĐƯỜNG",       source:"Mina",  lesson:11 },
    { word:"本屋",    reading:"ほんや",       meaning:"tiệm sách",           sino:"BẢN ỐC",          source:"Mina",  lesson:6  },
  ],
  "人": [
    { word:"人",      reading:"ひと",         meaning:"người",               sino:"NHÂN",            source:"Mina",  lesson:1  },
    { word:"日本人",  reading:"にほんじん",   meaning:"người Nhật",          sino:"NHẬT BẢN NHÂN",  source:"Mina",  lesson:1  },
    { word:"外国人",  reading:"がいこくじん", meaning:"người nước ngoài",    sino:"NGOẠI QUỐC NHÂN",source:"Mina",  lesson:1  },
    { word:"何人",    reading:"なんにん",     meaning:"mấy người",           sino:"HÀ NHÂN",         source:"Mina",  lesson:11 },
  ],
  "学": [
    { word:"学校",    reading:"がっこう",     meaning:"trường học",          sino:"HỌC HIỆU",        source:"Mina",  lesson:11 },
    { word:"大学",    reading:"だいがく",     meaning:"đại học",             sino:"ĐẠI HỌC",         source:"Mina",  lesson:1  },
    { word:"学生",    reading:"がくせい",     meaning:"học sinh, sinh viên", sino:"HỌC SINH",        source:"Mina",  lesson:1  },
    { word:"留学生",  reading:"りゅうがくせい",meaning:"du học sinh",        sino:"LƯU HỌC SINH",    source:"Mina",  lesson:1  },
    { word:"大学院",  reading:"だいがくいん", meaning:"cao học",             sino:"ĐẠI HỌC VIỆN",   source:"Tango", lesson:12 },
  ],
  "先": [
    { word:"先生",    reading:"せんせい",     meaning:"giáo viên, thầy cô",  sino:"TIÊN SINH",       source:"Mina",  lesson:1  },
    { word:"先週",    reading:"せんしゅう",   meaning:"tuần trước",          sino:"TIÊN TUẦN",       source:"Mina",  lesson:4  },
    { word:"先月",    reading:"せんげつ",     meaning:"tháng trước",         sino:"TIÊN NGUYỆT",    source:"Mina",  lesson:4  },
  ],
  "生": [
    { word:"先生",    reading:"せんせい",     meaning:"giáo viên",           sino:"TIÊN SINH",       source:"Mina",  lesson:1  },
    { word:"学生",    reading:"がくせい",     meaning:"học sinh",            sino:"HỌC SINH",        source:"Mina",  lesson:1  },
    { word:"誕生日",  reading:"たんじょうび", meaning:"sinh nhật",           sino:"ĐẢN SINH NHẬT",  source:"Mina",  lesson:5  },
    { word:"生活",    reading:"せいかつ",     meaning:"cuộc sống",           sino:"SINH HOẠT",       source:"Tango", lesson:18 },
  ],
  "語": [
    { word:"日本語",  reading:"にほんご",     meaning:"tiếng Nhật",          sino:"NHẬT BẢN NGỮ",   source:"Mina",  lesson:1  },
    { word:"英語",    reading:"えいご",       meaning:"tiếng Anh",           sino:"ANH NGỮ",         source:"Mina",  lesson:1  },
    { word:"スペイン語",reading:"スペインご",meaning:"tiếng Tây Ban Nha",   sino:"TÂY NGỮ",         source:"Mina",  lesson:1  },
    { word:"外国語",  reading:"がいこくご",   meaning:"ngoại ngữ",          sino:"NGOẠI QUỐC NGỮ", source:"Tango", lesson:12 },
  ],
  "時": [
    { word:"時間",    reading:"じかん",       meaning:"thời gian, tiếng (giờ)",sino:"THỜI GIAN",     source:"Mina",  lesson:4  },
    { word:"時計",    reading:"とけい",       meaning:"đồng hồ",             sino:"THỜI KÈO",        source:"Mina",  lesson:2  },
    { word:"〜時",    reading:"〜じ",         meaning:"...giờ",              sino:"THỜI",            source:"Mina",  lesson:3  },
    { word:"時代",    reading:"じだい",       meaning:"thời đại",            sino:"THỜI ĐẠI",        source:"Tango", lesson:22 },
  ],
  "食": [
    { word:"食べます",reading:"たべます",     meaning:"ăn",                  sino:"THỰC",            source:"Mina",  lesson:6  },
    { word:"食事",    reading:"しょくじ",     meaning:"bữa ăn",              sino:"THỰC SỰ",         source:"Mina",  lesson:14 },
    { word:"食堂",    reading:"しょくどう",   meaning:"căng-tin, phòng ăn",  sino:"THỰC ĐƯỜNG",     source:"Mina",  lesson:7  },
    { word:"和食",    reading:"わしょく",     meaning:"ẩm thực Nhật",        sino:"HÒA THỰC",        source:"Tango", lesson:9  },
  ],
  "行": [
    { word:"行きます",reading:"いきます",     meaning:"đi",                  sino:"HÀNH",            source:"Mina",  lesson:6  },
    { word:"旅行",    reading:"りょこう",     meaning:"du lịch",             sino:"LỮ HÀNH",         source:"Mina",  lesson:9  },
    { word:"銀行",    reading:"ぎんこう",     meaning:"ngân hàng",           sino:"NGÂN HÀNG",       source:"Mina",  lesson:7  },
    { word:"旅行会社",reading:"りょこうがいしゃ",meaning:"công ty du lịch",  sino:"LỮ HÀNH HỘI XÃ",source:"Tango", lesson:13 },
  ],
  "見": [
    { word:"見ます",  reading:"みます",       meaning:"xem, nhìn",           sino:"KIẾN",            source:"Mina",  lesson:6  },
    { word:"見せます",reading:"みせます",     meaning:"cho xem",             sino:"KIẾN",            source:"Mina",  lesson:13 },
    { word:"見物",    reading:"けんぶつ",     meaning:"tham quan, ngắm cảnh",sino:"KIẾN VẬT",       source:"Mina",  lesson:9  },
    { word:"意見",    reading:"いけん",       meaning:"ý kiến",              sino:"Ý KIẾN",          source:"Tango", lesson:24 },
  ],
  "来": [
    { word:"来ます",  reading:"きます",       meaning:"đến, tới",            sino:"LAI",             source:"Mina",  lesson:6  },
    { word:"来週",    reading:"らいしゅう",   meaning:"tuần sau",            sino:"LAI TUẦN",        source:"Mina",  lesson:4  },
    { word:"来月",    reading:"らいげつ",     meaning:"tháng sau",           sino:"LAI NGUYỆT",     source:"Mina",  lesson:4  },
    { word:"来年",    reading:"らいねん",     meaning:"năm sau",             sino:"LAI NIÊN",        source:"Mina",  lesson:4  },
  ],
  "聞": [
    { word:"聞きます",reading:"ききます",     meaning:"nghe, hỏi",           sino:"VĂN",             source:"Mina",  lesson:6  },
    { word:"新聞",    reading:"しんぶん",     meaning:"báo (tờ báo)",        sino:"TÂN VĂN",        source:"Mina",  lesson:9  },
    { word:"聞こえます",reading:"きこえます",meaning:"nghe thấy",           sino:"VĂN",             source:"Tango", lesson:21 },
  ],
  "気": [
    { word:"天気",    reading:"てんき",       meaning:"thời tiết",           sino:"THIÊN KHÍ",       source:"Mina",  lesson:8  },
    { word:"元気",    reading:"げんき",       meaning:"khỏe mạnh",          sino:"NGUYÊN KHÍ",     source:"Mina",  lesson:4  },
    { word:"気持ち",  reading:"きもち",       meaning:"cảm giác",           sino:"KHÍ TRÌ",         source:"Mina",  lesson:12 },
    { word:"気をつけます",reading:"きをつけます",meaning:"cẩn thận",        sino:"KHÍ",             source:"Mina",  lesson:14 },
  ],
  "車": [
    { word:"電車",    reading:"でんしゃ",     meaning:"tàu điện",            sino:"ĐIỆN XA",         source:"Mina",  lesson:7  },
    { word:"自動車",  reading:"じどうしゃ",   meaning:"ô tô",               sino:"TỰ ĐỘNG XA",      source:"Mina",  lesson:16 },
    { word:"自転車",  reading:"じてんしゃ",   meaning:"xe đạp",             sino:"TỰ CHUYỂN XA",   source:"Mina",  lesson:7  },
    { word:"乗ります",reading:"のります",     meaning:"lên xe, đi xe",       sino:"THỪA",            source:"Mina",  lesson:17 },
  ],
  "書": [
    { word:"書きます",reading:"かきます",     meaning:"viết",               sino:"THƯ",             source:"Mina",  lesson:6  },
    { word:"辞書",    reading:"じしょ",       meaning:"từ điển",             sino:"TỪ THƯ",          source:"Mina",  lesson:6  },
    { word:"教科書",  reading:"きょうかしょ", meaning:"sách giáo khoa",      sino:"GIÁO KHOA THƯ",  source:"Tango", lesson:14 },
    { word:"図書館",  reading:"としょかん",   meaning:"thư viện",            sino:"ĐỒ THƯ QUÁN",    source:"Tango", lesson:13 },
  ],
  "読": [
    { word:"読みます",reading:"よみます",     meaning:"đọc",                sino:"ĐỌC",             source:"Mina",  lesson:6  },
    { word:"読書",    reading:"どくしょ",     meaning:"đọc sách",            sino:"ĐỌC THƯ",         source:"Tango", lesson:16 },
    { word:"音読み",  reading:"おんよみ",     meaning:"âm On",              sino:"ÂM ĐỌC",          source:"Tango", lesson:1  },
  ],
  "話": [
    { word:"話します",reading:"はなします",   meaning:"nói chuyện",          sino:"THOẠI",           source:"Mina",  lesson:13 },
    { word:"電話",    reading:"でんわ",       meaning:"điện thoại",          sino:"ĐIỆN THOẠI",      source:"Mina",  lesson:6  },
    { word:"会話",    reading:"かいわ",       meaning:"hội thoại",          sino:"HỘI THOẠI",       source:"Tango", lesson:5  },
    { word:"話題",    reading:"わだい",       meaning:"chủ đề câu chuyện",  sino:"THOẠI ĐỀ",        source:"Tango", lesson:19 },
  ],
  "国": [
    { word:"外国",    reading:"がいこく",     meaning:"nước ngoài",         sino:"NGOẠI QUỐC",      source:"Mina",  lesson:1  },
    { word:"国",      reading:"くに",         meaning:"đất nước, quê hương",sino:"QUỐC",            source:"Mina",  lesson:1  },
    { word:"中国",    reading:"ちゅうごく",   meaning:"Trung Quốc",         sino:"TRUNG QUỐC",      source:"Mina",  lesson:1  },
    { word:"国際",    reading:"こくさい",     meaning:"quốc tế",            sino:"QUỐC TẾ",         source:"Tango", lesson:20 },
  ],
  "金": [
    { word:"お金",    reading:"おかね",       meaning:"tiền",               sino:"KIM",             source:"Mina",  lesson:13 },
    { word:"金曜日",  reading:"きんようび",   meaning:"Thứ Sáu",            sino:"KIM DIỆU NHẬT",  source:"Mina",  lesson:5  },
    { word:"料金",    reading:"りょうきん",   meaning:"phí, giá tiền",       sino:"LIỆU KIM",        source:"Tango", lesson:15 },
  ],
  "水": [
    { word:"水",      reading:"みず",         meaning:"nước",               sino:"THỦY",            source:"Mina",  lesson:8  },
    { word:"水曜日",  reading:"すいようび",   meaning:"Thứ Tư",             sino:"THỦY DIỆU NHẬT", source:"Mina",  lesson:5  },
    { word:"水泳",    reading:"すいえい",     meaning:"bơi lội",            sino:"THỦY VỊNH",       source:"Tango", lesson:17 },
  ],
  "山": [
    { word:"山",      reading:"やま",         meaning:"núi",                sino:"SAN",             source:"Mina",  lesson:8  },
    { word:"富士山",  reading:"ふじさん",     meaning:"núi Phú Sĩ",         sino:"PHÚ SĨ SAN",     source:"Mina",  lesson:8  },
    { word:"登山",    reading:"とざん",       meaning:"leo núi",             sino:"ĐĂNG SAN",        source:"Tango", lesson:17 },
  ],
  "天": [
    { word:"天気",    reading:"てんき",       meaning:"thời tiết",           sino:"THIÊN KHÍ",       source:"Mina",  lesson:8  },
    { word:"天才",    reading:"てんさい",     meaning:"thiên tài",           sino:"THIÊN TÀI",       source:"Tango", lesson:19 },
    { word:"天井",    reading:"てんじょう",   meaning:"trần nhà",            sino:"THIÊN TỈNH",      source:"Tango", lesson:26 },
  ],
  "空": [
    { word:"空港",    reading:"くうこう",     meaning:"sân bay",             sino:"KHÔNG CẢNG",      source:"Mina",  lesson:7  },
    { word:"空気",    reading:"くうき",       meaning:"không khí",          sino:"KHÔNG KHÍ",       source:"Tango", lesson:18 },
    { word:"青空",    reading:"あおぞら",     meaning:"bầu trời xanh",       sino:"THANH KHÔNG",    source:"Tango", lesson:11 },
  ],
};


/* ─────────────────── COMPOUND GRAPH ─────────────────── */
function CompoundGraph({ kanji, color }: { kanji: KanjiItem; color: string }) {
  const compounds = KANJI_COMPOUNDS[kanji.kanji] || [];
  const W = 600, H = 340;
  const MX = W / 2, MY = H / 2;
  const COLORS = ["#059669", "#2563eb", "#7c3aed", "#d97706", "#dc2626", "#0891b2"];
  const NODE_R = 48;
  const MAIN_R = 42;

  const initPositions = () => {
    const pos: Record<string, { x: number; y: number }> = { "__main__": { x: MX, y: MY } };
    compounds.forEach((c, i) => {
      const angle = (2 * Math.PI * i / compounds.length) - Math.PI / 2;
      pos[c.word] = { x: MX + 140 * Math.cos(angle), y: MY + 140 * Math.sin(angle) };
    });
    return pos;
  };

  const [positions, setPositions] = React.useState<Record<string, { x: number; y: number }>>(initPositions);
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dragStart, setDragStart] = React.useState<{ mx: number; my: number; snapshot: Record<string, { x: number; y: number }> }>({ mx: 0, my: 0, snapshot: {} });
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [isSnapping, setIsSnapping] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setPositions(initPositions()); setIsSnapping(false); setZoom(1); }, [kanji.kanji]);

  // Scroll-to-zoom
  React.useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.min(2.5, Math.max(0.4, +(z + (e.deltaY > 0 ? -0.1 : 0.1)).toFixed(2))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const vbW = W / zoom, vbH = H / zoom;
  const vbX = (W - vbW) / 2, vbY = (H - vbH) / 2;

  const startDrag = (e: React.PointerEvent<Element>, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setIsSnapping(false);
    setDragging(id);
    setDragStart({ mx: e.clientX, my: e.clientY, snapshot: { ...positions } });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = vbW / rect.width, sy = vbH / rect.height;
    const ddx = (e.clientX - dragStart.mx) * sx;
    const ddy = (e.clientY - dragStart.my) * sy;
    if (dragging === "__main__") {
      const orig = dragStart.snapshot["__main__"];
      setPositions(p => ({ ...p, "__main__": { x: Math.max(MAIN_R + 4, Math.min(W - MAIN_R - 4, orig.x + ddx)), y: Math.max(MAIN_R + 4, Math.min(H - MAIN_R - 4, orig.y + ddy)) } }));
    } else {
      const orig = dragStart.snapshot[dragging];
      setPositions(p => ({ ...p, [dragging]: { x: Math.max(NODE_R + 4, Math.min(W - NODE_R - 4, orig.x + ddx)), y: Math.max(NODE_R + 4, Math.min(H - NODE_R - 4, orig.y + ddy)) } }));
    }
  };

  const stopDrag = () => {
    if (dragging === "__main__") {
      setIsSnapping(true);
      setPositions(p => ({ ...p, "__main__": { x: MX, y: MY } }));
      setTimeout(() => setIsSnapping(false), 650);
    }
    setDragging(null);
  };

  const mainPos = positions["__main__"] ?? { x: MX, y: MY };
  const pullDist = Math.sqrt((mainPos.x - MX) ** 2 + (mainPos.y - MY) ** 2);
  const stretch = dragging === "__main__" ? Math.min(1, pullDist / 90) : 0;

  if (compounds.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 14 }}>
      Chưa có dữ liệu từ ghép cho kanji này
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "linear-gradient(145deg,#f5f7ff,#eef1fb)", border: "1px solid #e2e8f0" }}>
      <style>{`
        @keyframes cg-dash { to { stroke-dashoffset: -28; } }
        @keyframes cg-snap-bounce {
          0%{transform:scale(1)} 20%{transform:scale(1.22)} 40%{transform:scale(0.87)}
          60%{transform:scale(1.10)} 80%{transform:scale(0.96)} 100%{transform:scale(1)}
        }
      `}</style>

      {/* Zoom controls */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 20, display: "flex", flexDirection: "column", gap: 3 }}>
        <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.2).toFixed(2)))}
          style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid #e2e8f0", background: "rgba(255,255,255,0.92)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#475569", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          title="Phóng to">+</button>
        <div style={{ width: 28, height: 22, borderRadius: 5, background: "rgba(255,255,255,0.88)", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#64748b" }}>
          {Math.round(zoom * 100)}%
        </div>
        <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.2).toFixed(2)))}
          style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid #e2e8f0", background: "rgba(255,255,255,0.92)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#475569", lineHeight: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          title="Thu nhỏ">−</button>
        {zoom !== 1 && (
          <button onClick={() => setZoom(1)}
            style={{ width: 28, height: 22, borderRadius: 5, border: "1.5px solid #c7d2fe", background: "rgba(238,242,255,0.95)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#4f46e5" }}>
            100%</button>
        )}
      </div>

      <svg ref={svgRef} width="100%" viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", cursor: dragging ? "grabbing" : "default", touchAction: "none" }}
        onPointerMove={onDrag} onPointerUp={stopDrag} onPointerLeave={stopDrag}>
        <defs>
          <pattern id="dp-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.2" fill="#dde3f0" />
          </pattern>
          {COLORS.map((c, i) => (
            <marker key={i} id={`dp-arr-${i}`} markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={c} opacity="0.8" />
            </marker>
          ))}
        </defs>
        <rect width={W} height={H} fill="url(#dp-grid)" />

        {/* Lines */}
        {compounds.map((c, i) => {
          const cp = positions[c.word] ?? { x: 0, y: 0 };
          const col = COLORS[i % COLORS.length];
          const dx = mainPos.x - cp.x, dy = mainPos.y - cp.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len, uy = dy / len;
          const x1 = cp.x + ux * NODE_R, y1 = cp.y + uy * NODE_R;
          const x2 = mainPos.x - ux * (MAIN_R + 2), y2 = mainPos.y - uy * (MAIN_R + 2);
          const sw = 2.2 + stretch * 3.5;
          const op = 0.68 + stretch * 0.32;
          return (
            <g key={c.word}>
              {stretch > 0.05 && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={sw + 8} opacity={stretch * 0.18} style={{ filter: "blur(5px)" }} />}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={sw} strokeDasharray="6 4" opacity={op}
                markerEnd={`url(#dp-arr-${i % COLORS.length})`}
                style={{
                  animationName: "cg-dash",
                  animationDuration: `${0.75 - stretch * 0.3}s`,
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: `${i * 0.12}s`,
                }} />
              <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={3 + stretch * 2.5} fill={col} opacity={0.55 + stretch * 0.35} />
            </g>
          );
        })}

        {/* Compound nodes */}
        {compounds.map((c, i) => {
          const cp = positions[c.word] ?? { x: 0, y: 0 };
          const col = COLORS[i % COLORS.length];
          const isHov = hovered === c.word;
          const isDrag = dragging === c.word;
          const sc = isDrag ? 1.08 : isHov ? 1.05 : 1;
          return (
            <g key={c.word} transform={`translate(${cp.x},${cp.y}) scale(${sc})`}
              style={{ cursor: isDrag ? "grabbing" : "grab", transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
              onPointerDown={e => startDrag(e, c.word)}
              onPointerEnter={() => setHovered(c.word)}
              onPointerLeave={() => setHovered(null)}>
              <circle r={NODE_R + 1} fill="rgba(0,0,0,0.08)" transform="translate(2,4)" style={{ filter: "blur(4px)" }} />
              <circle r={NODE_R + 4} fill="none" stroke={col} strokeWidth={isHov || isDrag ? "2.5" : "1.5"} opacity={isHov || isDrag ? 0.5 : 0.2} style={{ transition: "all 0.18s" }} />
              <circle r={NODE_R} fill="white" stroke={col} strokeWidth={isHov || isDrag ? "3" : "2"}
                style={{ filter: isDrag ? "drop-shadow(0 6px 18px rgba(0,0,0,0.18))" : isHov ? "drop-shadow(0 3px 10px rgba(0,0,0,0.10))" : "none", transition: "all 0.18s" }} />
              <circle r={NODE_R} fill={col} opacity="0.06" />
              <ellipse cx="-10" cy="-16" rx="18" ry="12" fill="rgba(255,255,255,0.5)" />
              <text textAnchor="middle" y="-6" fontSize="20" fontFamily="var(--font-jp)" fontWeight="800" fill="#1e293b">{c.word}</text>
              <text textAnchor="middle" y="12" fontSize="10" fontFamily="var(--font-jp)" fill={col} fontWeight="700">{c.reading}</text>
              <text textAnchor="middle" y="26" fontSize="9" fill="#64748b">{c.meaning}</text>
            </g>
          );
        })}

        {/* Main node */}
        <g transform={`translate(${mainPos.x},${mainPos.y})`}
          style={{ cursor: dragging === "__main__" ? "grabbing" : "grab", transition: isSnapping ? "transform 0.55s cubic-bezier(0.34,1.56,0.64,1)" : "none", animation: isSnapping ? "cg-snap-bounce 0.55s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}
          onPointerDown={e => startDrag(e, "__main__")}>
          <circle r={MAIN_R + 14} fill={color} opacity={0.06 + stretch * 0.12} style={{ transition: "opacity 0.1s" }} />
          <circle r={MAIN_R + 7} fill={color} opacity={0.09 + stretch * 0.14} style={{ transition: "opacity 0.1s" }} />
          <circle r={MAIN_R} fill={color} style={{ filter: dragging === "__main__" ? `drop-shadow(0 8px 28px ${color}99)` : "drop-shadow(0 6px 22px rgba(0,0,0,0.25))", transition: "filter 0.2s" }} />
          <ellipse cx="-8" cy="-14" rx="16" ry="10" fill="rgba(255,255,255,0.32)" />
          <text textAnchor="middle" dy=".35em" fontSize="28" fontFamily="var(--font-jp)" fontWeight="900" fill="white">{kanji.kanji}</text>
          {dragging === "__main__" && stretch > 0.08 && (
            <text textAnchor="middle" y={MAIN_R + 16} fontSize="9" fill={color} fontWeight="700" opacity="0.9">↩ thả → bung lại</text>
          )}
        </g>
      </svg>

      <div style={{ padding: "8px 16px 12px", fontSize: 11, color: "#94a3b8", borderTop: "1px solid #edf0f7", display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="#94a3b8" strokeWidth="1.2"/><path d="M6 3.5v5M3.5 6h5" stroke="#94a3b8" strokeWidth="1.2"/></svg>
        Cuộn chuột để zoom · Kéo chữ gốc → dây thun · Kéo từ ghép để sắp xếp
      </div>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function KanjiDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawParam = params?.kanji as string | undefined;
  const kanjiChar = rawParam ? decodeURIComponent(rawParam) : "";
  const kanji = kanjiData.find(k => k.kanji === kanjiChar) ?? null;

  if (!kanji) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#64748b" }}>
      <div style={{ fontSize: 64, fontFamily: "var(--font-jp)" }}>？</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Không tìm thấy kanji &quot;{kanjiChar}&quot;</div>
      <button onClick={() => router.back()} style={{ padding: "10px 20px", borderRadius: 10, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
        ← Quay lại
      </button>
    </div>
  );

  const meta = LEVEL_META[kanji.level] ?? LEVEL_META.N5;
  const compounds = KANJI_COMPOUNDS[kanji.kanji] || [];
  const related = kanjiData.filter(k => k.level === kanji.level && k.kanji !== kanji.kanji).slice(0, 12);

  return (
    <>
      <style>{`
        @keyframes dp-slide-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dp-fade-in  { from { opacity:0; } to { opacity:1; } }
        @keyframes dp-scale-in { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        .dp-page { padding: 28px 36px; max-width: 1200px; margin: 0 auto; min-height: 100vh; animation: dp-fade-in 0.3s ease; }
        .dp-hero  { display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center; margin-bottom: 36px; animation: dp-slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .dp-body  { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .dp-card  { background: var(--color-card-bg); border-radius: 20px; padding: 24px; border: 1px solid var(--color-border); }
        .dp-compound-list { display: flex; flex-direction: column; gap: 10px; }
        .dp-compound-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 12px; background: var(--color-border-light); border: 1px solid var(--color-border); cursor: pointer; transition: all 0.18s ease; }
        .dp-compound-item:hover { background: white; transform: translateX(4px); box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
        .dp-related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)); gap: 8px; }
        .dp-related-btn { aspect-ratio: 1; border-radius: 12px; border: 1.5px solid var(--color-border); background: linear-gradient(145deg,#f8fafc,#f1f5f9); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); font-family: var(--font-jp); font-size: 22px; font-weight: 700; }
        .dp-related-btn:hover { transform: translateY(-4px) scale(1.08); border-color: ${meta.color}; background: ${meta.bg}; box-shadow: 0 8px 20px ${meta.glow}; }
        @media (max-width: 860px) {
          .dp-page { padding: 18px 16px; }
          .dp-hero { grid-template-columns: 1fr; gap: 20px; }
          .dp-body { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dp-page">
        {/* Back */}
        <button onClick={() => router.back()}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 24, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-card-bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", transition: "all 0.18s ease" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border-light)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--color-card-bg)"; }}>
          <ArrowLeft size={15} /> Quay lại
        </button>

        {/* Hero */}
        <div className="dp-hero">
          <div style={{ position: "relative" }}>
            <div style={{ width: 160, height: 160, borderRadius: 32, background: meta.bg, border: `3px solid ${meta.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, fontFamily: "var(--font-jp)", fontWeight: 900, boxShadow: `0 16px 48px ${meta.glow}, 0 0 0 1px ${meta.border}40`, position: "relative", overflow: "hidden", animation: "dp-scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: meta.border, opacity: 0.12 }} />
              {kanji.kanji}
            </div>
          </div>
          <div style={{ animation: "dp-slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{kanji.level} · {meta.label}</span>
              <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, background: "var(--color-border-light)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{kanji.strokeCount} nét</span>
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-1px", color: "var(--color-text-primary)", lineHeight: 1.1 }}>{kanji.meaning}</div>
            <div style={{ fontSize: 18, color: "var(--color-text-secondary)", fontFamily: "var(--font-jp)", marginTop: 8 }}>{kanji.reading}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <SpeakButton text={kanji.reading} accentColor={meta.color} size={16} title="Phát âm" />
              {[
                { icon: <Pen size={16} />, label: "Luyện viết", variant: "secondary" },
                { icon: <CreditCard size={16} />, label: "Flashcard", variant: "primary" },
                { icon: <BookOpen size={16} />, label: "Tra từ điển", variant: "secondary" },
              ].map((btn) => (
                <button key={btn.label} className={btn.variant === "primary" ? "btn-primary" : "btn-secondary"} style={{ padding: "10px 18px", fontSize: 13 }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="dp-body">
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Readings */}
            <div className="dp-card" style={{ animation: "dp-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: meta.color }} />
                Âm đọc
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "ÂM ON (音読み)", value: kanji.onyomi, icon: "🔊", hint: "âm Hán-Việt" },
                  { label: "ÂM KUN (訓読み)", value: kanji.kunyomi || "—", icon: "📖", hint: "âm thuần Nhật" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "16px", borderRadius: 14, background: "var(--color-border-light)", border: "1px solid var(--color-border)", position: "relative" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{r.icon} {r.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-jp)", color: meta.color }}>{r.value}</div>
                      {r.value !== "—" && <SpeakButton text={r.value} accentColor={meta.color} size={13} />}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{r.hint}</div>
                  </div>
                ))}
              </div>
            </div>


            {/* Stroke order */}
            <div className="dp-card" style={{ animation: "dp-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.22s both" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: meta.color }} />
                  Thứ tự nét
                </span>
                <span style={{ fontSize: 10, color: "#94a3b8", background: "var(--color-border-light)", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>
                  {kanji.strokeCount} nét
                </span>
              </div>
              <KanjiStrokeOrder kanji={kanji.kanji} color={meta.color} width={260} height={260} />
            </div>

            {/* Compound graph */}
            {compounds.length > 0 && (
              <div className="dp-card" style={{ padding: 0, animation: "dp-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.25s both" }}>
                <div style={{ padding: "18px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: meta.color }} />
                    Sơ đồ từ ghép
                  </div>
                  <span style={{ fontSize: 10, color: "#94a3b8", background: "var(--color-border-light)", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>{compounds.length} từ · kéo thả</span>
                </div>
                <CompoundGraph kanji={kanji} color={meta.color} />
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Compound list */}
            {compounds.length > 0 && (
              <div className="dp-card" style={{ animation: "dp-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: meta.color }} />
                  Từ ghép phổ biến
                </div>
                <div className="dp-compound-list">
                  {compounds.map((c, i) => {
                    const col = ["#059669","#2563eb","#7c3aed","#d97706","#dc2626","#0891b2"][i % 6];
                    return (
                      <div key={c.word} className="dp-compound-item">
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${col}14`, border: `1.5px solid ${col}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontFamily: "var(--font-jp)", fontWeight: 800, color: col, flexShrink: 0 }}>{c.word[0]}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-jp)", color: "var(--color-text-primary)" }}>{c.word}</div>
                          <div style={{ fontSize: 11, fontFamily: "var(--font-jp)", color: col, marginTop: 1 }}>{c.reading}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>{c.meaning}</div>
                        </div>
                        <ChevronRight size={14} color="var(--color-text-muted)" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mina / Tango vocabulary */}
            {(() => {
              const vocab = MINA_TANGO_VOCAB[kanji.kanji] || [];
              if (vocab.length === 0) return null;
              return (
                <div className="dp-card" style={{ animation: "dp-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.25s both" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 3, height: 16, borderRadius: 2, background: meta.color }} />
                      Từ vựng (Mina, Tango)
                    </span>
                    <a href="#" style={{ fontSize: 11, color: meta.color, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                      Flashcard →
                    </a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {vocab.map((v, vi) => (
                      <div key={v.word + vi}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 0",
                          borderBottom: vi < vocab.length - 1 ? "1px solid var(--color-border)" : "none",
                        }}>
                        {/* Source badge */}
                        <div style={{
                          flexShrink: 0,
                          width: 36, height: 20, borderRadius: 5, fontSize: 9, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: v.source === "Mina" ? "#ede9fe" : "#dbeafe",
                          color: v.source === "Mina" ? "#6d28d9" : "#1d4ed8",
                          border: v.source === "Mina" ? "1px solid #c4b5fd" : "1px solid #93c5fd",
                        }}>{v.source}</div>

                        {/* Word info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-jp)", color: "var(--color-text-primary)" }}>{v.word}</span>
                            <span style={{ fontSize: 11, fontFamily: "var(--font-jp)", color: meta.color, background: `${meta.color}14`, padding: "1px 6px", borderRadius: 4 }}>({v.reading})</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>·</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.02em" }}>{v.sino}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{v.meaning}</div>
                        </div>

                        {/* Lesson badge */}
                        {v.lesson && (
                          <div style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, color: "#94a3b8", background: "var(--color-border-light)", border: "1px solid var(--color-border)", padding: "2px 6px", borderRadius: 5 }}>
                            L{v.lesson}
                          </div>
                        )}

                        {/* Audio icon – real TTS */}
                        <SpeakButton text={v.word} accentColor={meta.color} size={14} title={`Phát âm: ${v.word}`} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Related kanji */}
            <div className="dp-card" style={{ animation: "dp-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: meta.color }} />
                  Kanji cùng trình độ {kanji.level}
                </span>
                <button onClick={() => router.back()} style={{ fontSize: 11, color: meta.color, background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                  Xem tất cả <ChevronRight size={11} />
                </button>
              </div>
              <div className="dp-related-grid">
                {related.map(r => (
                  <button key={r.kanji} className="dp-related-btn"
                    onClick={() => router.push(`/kanji/${encodeURIComponent(r.kanji)}`)}
                    style={{ color: "var(--color-text-primary)" }}>
                    {r.kanji}
                    <span style={{ fontSize: 7, color: "var(--color-text-muted)", fontFamily: "sans-serif" }}>{r.reading.split("・")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sparkle note */}
            <div style={{ padding: "16px 18px", borderRadius: 14, background: "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "1px solid #c4b5fd", display: "flex", alignItems: "flex-start", gap: 12, animation: "dp-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.35s both" }}>
              <Sparkles size={18} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", marginBottom: 4 }}>Mẹo học {kanji.kanji}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
                  Hãy liên kết kanji với hình ảnh hoặc câu chuyện. Ghi nhớ theo bộ thủ và từ ghép sẽ giúp bạn nhớ lâu hơn nhiều so với học riêng lẻ.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
