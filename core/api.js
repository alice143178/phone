import { State } from './state.js';

export function APIError(message, code) {
  this.message = message;
  this.code = code || 'UNKNOWN';
  this.name = 'APIError';
}

function sleep(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

function parseJSON(str) {
  var clean = str.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  return JSON.parse(clean);
}

function extractJSON(str) {
  var s = str.indexOf('{'), e = str.lastIndexOf('}');
  if (s < 0 || e < 0) return null;
  try { return JSON.parse(str.slice(s, e+1)); } catch(e) { return null; }
}

function doFetch(messages, systemPrompt, cfg) {
  var body = {
    model: cfg.model,
    temperature: cfg.temperature,
    max_tokens: cfg.maxTokens,
    messages: [{ role:'system', content: systemPrompt }].concat(messages)
  };
  if (cfg.jsonMode) body.response_format = { type: 'json_object' };

  return fetch(cfg.apiBaseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.apiKey
    },
    body: JSON.stringify(body)
  }).catch(function(e) {
    throw new APIError('网络连接失败: ' + e.message, 'NETWORK');
  }).then(function(res) {
    if (!res.ok) {
      return res.json().catch(function(){ return {}; }).then(function(err) {
        var msg = (err.error && err.error.message) || ('请求失败 ' + res.status);
        var code = res.status === 401 ? 'AUTH' : res.status === 400 ? 'BAD_REQUEST' : 'SERVER';
        throw new APIError(msg, code);
      });
    }
    return res.json();
  }).then(function(data) {
    var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new APIError('API返回内容为空', 'EMPTY');
    return content;
  });
}

export function callAI(messages, systemPrompt, options) {
  options = options || {};
  var s = State.settings;
  if (!s.apiKey) return Promise.reject(new APIError('未配置API Key，请前往设置', 'NO_KEY'));
  if (!s.apiBaseUrl) return Promise.reject(new APIError('未配置API地址', 'NO_URL'));

  var cfg = {
    apiBaseUrl: s.apiBaseUrl,
    apiKey: s.apiKey,
    model: options.model || s.model,
    temperature: options.temperature !== undefined ? options.temperature : s.temperature,
    maxTokens: options.maxTokens || s.maxTokens,
    jsonMode: options.jsonMode || false
  };

  var maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;

  function attempt(n) {
    return doFetch(messages, systemPrompt, cfg).catch(function(e) {
      if (e.code === 'NO_KEY' || e.code === 'NO_URL' || e.code === 'AUTH' || e.code === 'BAD_REQUEST') throw e;
      if (n >= maxRetries) throw e;
      return sleep(1000 * (n+1)).then(function(){ return attempt(n+1); });
    });
  }
  return attempt(0);
}

export function callChat(messages, systemPrompt, options) {
  options = Object.assign({}, options, { jsonMode: true, maxRetries: 2 });
  return callAI(messages, systemPrompt, options).then(function(raw) {
    try { return parseJSON(raw); }
    catch(e) {
      var ex = extractJSON(raw);
      if (ex) return ex;
      throw new APIError('回复格式解析失败，请重试', 'PARSE_ERROR');
    }
  });
}

export function testConnection() {
  return callAI(
    [{ role:'user', content:'请回复"连接成功"四个字。' }],
    '你是测试助手。',
    { maxRetries: 0, maxTokens: 20 }
  );
}
