const { parentPort, workerData } = require('node:worker_threads');
const { readFile } = require('node:fs/promises');

const MAX_TEXT = 2000000;
const BATCH_TEXT = 10000;
function splitText(text) {
  const chunks = [];
  let remaining = text.trim();
  while (remaining.length) {
    let end = Math.min(BATCH_TEXT, remaining.length);
    if (end < remaining.length) {
      const newline = remaining.lastIndexOf('\n', end);
      if (newline > end / 2) end = newline + 1;
      if (/[\uD800-\uDBFF]/.test(remaining[end - 1])) end--;
    }
    const chunk = remaining.slice(0, end);
    if (chunk.trim()) chunks.push(chunk);
    remaining = remaining.slice(end);
  }
  return chunks;
}

async function extract(file, extension, progress = () => {}) {
  const buffer = await readFile(file);
  let text = '';
  const add = value => {
    if (text.length + value.length > MAX_TEXT) throw new Error('Tài liệu vượt 2 triệu ký tự chữ. Hãy chia thành các file nhỏ hơn.');
    text += value;
  };
  if (extension === 'pdf') {
    if (buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('File PDF không hợp lệ.');
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength), isEvalSupported: false });
    try {
      const info = await parser.getInfo();
      if (info.total > 1000) throw new Error('PDF tối đa 1.000 trang. Hãy chia tài liệu lớn hơn.');
      for (let first = 1; first <= info.total; first += 10) {
        const last = Math.min(first + 9, info.total);
        add((await parser.getText({ partial: Array.from({ length: last - first + 1 }, (_, i) => first + i) })).text + '\n');
        progress(last, info.total);
      }
    } finally { await parser.destroy(); }
  } else if (extension === 'docx') {
    add((await require('mammoth').extractRawText({ buffer })).value);
  } else {
    add(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
  }
  if (text.trim().length < 2) throw new Error('Không tìm thấy chữ trong file. PDF scan cần OCR trước khi tải lên.');
  return splitText(text);
}

module.exports = { extract, splitText, MAX_TEXT, BATCH_TEXT };
if (parentPort) {
  extract(workerData.file, workerData.extension, (pagesRead, totalPages) => parentPort.postMessage({ progress: { pagesRead, totalPages } }))
    .then(batches => parentPort.postMessage({ batches }))
    .catch(error => parentPort.postMessage({ error: /^(Tài liệu vượt|PDF tối đa|Không tìm thấy|File PDF không hợp lệ)/.test(error.message) ? error.message : 'Không đọc được file. Kiểm tra định dạng, mã hóa UTF-8, mật khẩu PDF hoặc tài liệu bị hỏng.' }));
}
