/**

- core/api.js
- OpenAI兼容格式的API请求封装
- 支持JSON模式（用于聊天结构化输出）和普通文本模式
  */
  import { State } from ‘./state.js’;

// ── 主调用函数 ────────────────────────────────────────────────
/**

- @param {Array}  messages    - [{role:‘user’|‘assistant’, content:string}, …]
- @param {string} systemPrompt
- @param {Object} options
- @param {boolean} options.jsonMode   - 是否要求JSON输出（聊天主功能用）
- @param {number}  options.maxRetries - 失败重试次数，默认2
- @param {string}  options.model      - 覆盖默认模型
- @param {number}  options.temperature
- @param {number}  options.maxTokens
- @returns {Promise<string>} 模型原始输出文本
  */
  export async function callAI(messages, systemPrompt, options = {}) {
  const { apiBaseUrl, apiKey, model, temperature, maxTokens } = State.settings;

if (!apiKey) throw new APIError(‘未配置API Key，请前往设置’, ‘NO_KEY’);
if (!apiBaseUrl) throw new APIError(‘未配置API地址，请前往设置’, ‘NO_URL’);

const maxRetries = options.maxRetries ?? 2;
let lastErr;

for (let attempt = 0; attempt <= maxRetries; attempt++) {
try {
const result = await _fetch(messages, systemPrompt, {
apiBaseUrl,
apiKey,
model:       options.model       || model,
temperature: options.temperature ?? temperature,
maxTokens:   options.maxTokens   || maxTokens,
jsonMode:    options.jsonMode    || false,
});
return result;
} catch (e) {
lastErr = e;
// 不可重试的错误直接抛出
if (e instanceof APIError && [‘NO_KEY’,‘NO_URL’,‘AUTH’,‘BAD_REQUEST’].includes(e.code)) {
throw e;
}
// 最后一次也失败了
if (attempt === maxRetries) throw lastErr;
// 等待后重试
await sleep(1000 * (attempt + 1));
}
}
}

// ── 聊天专用：解析JSON格式回复 ───────────────────────────────
/**

- 调用AI并解析聊天JSON结构
- 返回 { messages: [{type, text}], soul: {outfit, inner} }
- 如果解析失败，自动重试一次
  */
  export async function callChat(messages, systemPrompt, options = {}) {
  const raw = await callAI(messages, systemPrompt, {
  …options,
  jsonMode: true,
  maxRetries: 2,
  });

// 尝试解析JSON
try {
return parseJSON(raw);
} catch {
// 解析失败：尝试从raw文本中提取JSON块
const extracted = extractJSON(raw);
if (extracted) return extracted;
throw new APIError(‘回复格式解析失败，请重试’, ‘PARSE_ERROR’);
}
}

// ── 内部fetch ─────────────────────────────────────────────────
async function _fetch(messages, systemPrompt, cfg) {
const body = {
model:       cfg.model,
temperature: cfg.temperature,
max_tokens:  cfg.maxTokens,
messages: [
{ role: ‘system’, content: systemPrompt },
…messages,
],
};

// JSON模式：部分API用 response_format，部分靠prompt保证
if (cfg.jsonMode) {
body.response_format = { type: ‘json_object’ };
}

let res;
try {
res = await fetch(`${cfg.apiBaseUrl}/chat/completions`, {
method: ‘POST’,
headers: {
‘Content-Type’:  ‘application/json’,
‘Authorization’: `Bearer ${cfg.apiKey}`,
},
body: JSON.stringify(body),
});
} catch (e) {
throw new APIError(‘网络连接失败：’ + e.message, ‘NETWORK’);
}

if (!res.ok) {
const err = await res.json().catch(() => ({}));
const msg = err?.error?.message || `请求失败 (${res.status})`;
const code = res.status === 401 ? ‘AUTH’
: res.status === 400 ? ‘BAD_REQUEST’
: ‘SERVER’;
throw new APIError(msg, code);
}

const data = await res.json();
const content = data?.choices?.[0]?.message?.content;
if (!content) throw new APIError(‘API返回内容为空’, ‘EMPTY’);
return content;
}

// ── 工具函数 ──────────────────────────────────────────────────

function parseJSON(str) {
// 去掉可能的markdown代码块包裹
const clean = str.replace(/^`(?:json)?\s*/i, '').replace(/\s*`$/,’’).trim();
return JSON.parse(clean);
}

function extractJSON(str) {
// 从文本中找到第一个完整的 { } 块
const start = str.indexOf(’{’);
const end   = str.lastIndexOf(’}’);
if (start === -1 || end === -1) return null;
try { return JSON.parse(str.slice(start, end + 1)); } catch { return null; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── 自定义错误类 ──────────────────────────────────────────────
export class APIError extends Error {
constructor(message, code = ‘UNKNOWN’) {
super(message);
this.name = ‘APIError’;
this.code = code;
}
}

// ── 测试连接 ──────────────────────────────────────────────────
export async function testConnection() {
const result = await callAI(
[{ role: ‘user’, content: ‘请回复”连接成功”这四个字。’ }],
‘你是一个测试助手。’,
{ maxRetries: 0, maxTokens: 20 }
);
return result;
}
