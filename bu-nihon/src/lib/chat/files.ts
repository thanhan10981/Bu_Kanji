import 'server-only';
import { ChatError } from './server';
import { singleRequestFileBytes as maxFileBytes } from './schema';
export { singleRequestFileBytes as maxFileBytes } from './schema';

export async function extractFile(file: File): Promise<string> {
  if (!file.size || file.size > maxFileBytes) throw new ChatError(400, 'Chọn file có nội dung, tối đa 4 MB.');
  const extension = file.name.split('.').at(-1)?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;
  try {
    if (extension === 'pdf') {
      if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new ChatError(400, 'File PDF không hợp lệ.');
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer), isEvalSupported: false });
      try {
        const info = await parser.getInfo();
        if (info.total > 30) throw new ChatError(400, 'PDF tối đa 30 trang mỗi lần. Hãy chia nhỏ tài liệu.');
        text = (await parser.getText()).text;
      } finally { await parser.destroy(); }
    } else if (extension === 'docx') {
      const { extractRawText } = await import('mammoth');
      text = (await extractRawText({ buffer })).value;
    } else if (['txt', 'csv', 'tsv', 'md', 'json'].includes(extension ?? '')) {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } else throw new ChatError(400, 'Hỗ trợ TXT, CSV, TSV, Markdown, JSON, PDF có chữ và Word DOCX.');
  } catch (error) {
    if (error instanceof ChatError) throw error;
    throw new ChatError(400, 'Không đọc được file. Kiểm tra định dạng, mã hóa UTF-8 hoặc mật khẩu PDF.');
  }
  if (text.trim().length < 2) throw new ChatError(400, 'Không tìm thấy chữ trong file. PDF scan cần được OCR trước khi tải lên.');
  if (text.length > 40000) throw new ChatError(400, 'File vượt 40.000 ký tự. Hãy chia nhỏ để AI xử lý đầy đủ.');
  return text.trim();
}
