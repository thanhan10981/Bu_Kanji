import 'server-only';
import { z } from 'zod';

export class ChatError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let windowStart = 0;
let requests = 0;
let active = 0;

// Local development only. Public use requires authentication and persistent quotas.
export async function guarded(request: Request, action: () => Promise<unknown>) {
  try {
    if (process.env.NODE_ENV !== 'development') throw new ChatError(403, 'AI hiện chỉ mở ở bản local. Cần xác thực và hạn mức trước khi mở công khai.');
    const url = new URL(request.url);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new ChatError(403, 'Chỉ cho phép truy cập AI từ localhost.');
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) throw new ChatError(403, 'Nguồn yêu cầu không hợp lệ.');
    if (Date.now() - windowStart > 60000) { windowStart = Date.now(); requests = 0; }
    if (requests >= 12 || active >= 2) throw new ChatError(429, 'Đã đạt giới hạn local: 12 yêu cầu/phút, 2 yêu cầu đồng thời. Vui lòng chờ.');
    requests++; active++;
    try { return Response.json(await action(), { headers: { 'Cache-Control': 'no-store' } }); }
    finally { active--; }
  } catch (error) {
    const known = error instanceof ChatError;
    return Response.json({ error: known ? error.message : error instanceof z.ZodError ? 'Dữ liệu không hợp lệ: kiểm tra model, độ dài và số tin nhắn.' : 'Không thể xử lý yêu cầu. Vui lòng thử lại.' },
      { status: known ? error.status : error instanceof z.ZodError ? 400 : 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function readBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new ChatError(400, 'Yêu cầu thiếu dữ liệu.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new ChatError(413, 'Dữ liệu quá lớn.'); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function config() {
  const secret = process.env.CHATMOCK_GATEWAY_SECRET?.trim();
  if (!secret || secret.startsWith('<')) throw new ChatError(503, 'Chưa cấu hình CHATMOCK_GATEWAY_SECRET. Điền khóa trong bu-nihon/.env.local rồi khởi động lại server.');
  const base = process.env.CHATMOCK_BASE_URL?.replace(/\/$/, '');
  if (!base) throw new ChatError(503, 'Chưa cấu hình CHATMOCK_BASE_URL ở server.');
  let url: URL;
  try { url = new URL(base); } catch { throw new ChatError(503, 'CHATMOCK_BASE_URL không phải URL hợp lệ.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new ChatError(503, 'CHATMOCK_BASE_URL phải là URL HTTPS hợp lệ.');
  return { base, secret };
}

export async function gateway(path: '/responses' | '/models', body?: unknown) {
  const { base, secret } = config();
  try {
    const response = await fetch(`${base}${path}`, {
      method: body ? 'POST' : 'GET', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'x-chatmock-key': secret },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) {
      // Never forward raw gateway responses: they may contain credentials or private diagnostics.
      const detail = (await response.text()).slice(0, 12000).toLowerCase();
      if (/session.{0,40}(expired|invalid|missing|unauthenticated)|session_expired|login_required|log.in.required|chatgpt.{0,40}(expired|login|unauthenticated)/.test(detail)) throw new ChatError(503, 'Phiên ChatGPT của gateway đã hết hoặc cần đăng nhập lại. Kiểm tra phiên ở Chatmock.');
      if ([401, 403].includes(response.status)) throw new ChatError(502, 'Gateway từ chối khóa. Kiểm tra CHATMOCK_GATEWAY_SECRET ở server.');
      if ([408, 504].includes(response.status) || /timed? ?out|timeout/.test(detail)) throw new ChatError(504, 'Gateway quá thời gian xử lý. Vui lòng thử lại.');
      if ([502, 530].includes(response.status) || /tunnel|cloudflare|connection refused/.test(detail)) throw new ChatError(503, 'Tunnel/gateway mất kết nối. Kiểm tra Chatmock và thử lại sau.');
      if ([429, 503].includes(response.status)) throw new ChatError(503, 'Gateway đang bận hoặc đã chạm hạn mức. Vui lòng thử lại sau.');
      throw new ChatError(502, `Gateway trả lỗi HTTP ${response.status}. Vui lòng kiểm tra cấu hình và thử lại.`);
    }
    return await response.json() as unknown;
  } catch (error) {
    if (error instanceof ChatError) throw error;
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new ChatError(504, 'Gateway quá thời gian chờ 90 giây. Vui lòng thử lại.');
    throw new ChatError(503, 'Không kết nối được gateway hoặc tunnel. Kiểm tra mạng và trạng thái Chatmock.');
  }
}

const outputSchema = z.object({
  output_text: z.string().optional(),
  output: z.array(z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional(),
});
export function outputText(value: unknown) {
  const parsed = outputSchema.safeParse(value);
  if (!parsed.success) throw new ChatError(502, 'Phản hồi gateway không đúng định dạng.');
  const text = parsed.data.output_text || parsed.data.output?.flatMap(item => item.content ?? []).filter(item => item.type === 'output_text').map(item => item.text ?? '').join('\n');
  if (!text?.trim()) throw new ChatError(502, 'AI chưa trả nội dung. Vui lòng thử lại.');
  if (text.length > 100000) throw new ChatError(502, 'Phản hồi AI quá dài. Hãy chia yêu cầu thành phần nhỏ hơn.');
  return text;
}
