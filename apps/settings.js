/**

- apps/settings.js
- 设置App：API配置、提示音、数据导入导出
  */
  import { State }   from ‘../core/state.js’;
  import { Storage } from ‘../core/storage.js’;
  import { testConnection } from ‘../core/api.js’;
  import { Events }  from ‘../core/events.js’;

export const META = { title: ‘设置’, hideHeader: false };

const CSS = `#settings-root { height: 100%; overflow-y: auto; background: var(--bg); padding: 12px 0 32px; } .s-section { margin: 0 14px 20px; } .s-section-title { font-size: 11px; font-weight: 700; color: var(--text2); letter-spacing: 0.08em; text-transform: uppercase; padding: 0 4px 8px; } .s-card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; } .s-row { display: flex; align-items: center; padding: 14px 16px; gap: 12px; border-bottom: 1px solid var(--border); min-height: 52px; } .s-row:last-child { border-bottom: none; } .s-row-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; } .s-row-body { flex: 1; min-width: 0; } .s-row-label { font-size: 14px; font-weight: 500; color: var(--text); } .s-row-sub { font-size: 11.5px; color: var(--text2); margin-top: 2px; word-break: break-all; } .s-input { width: 100%; background: transparent; border: none; outline: none; color: var(--text); font-size: 14px; font-family: var(--font); padding: 0; } .s-input::placeholder { color: var(--text2); } .s-input-row { display: flex; flex-direction: column; padding: 12px 16px; gap: 4px; border-bottom: 1px solid var(--border); } .s-input-row:last-child { border-bottom: none; } .s-input-label { font-size: 11px; color: var(--text2); font-weight: 600; letter-spacing: 0.04em; } .s-input-field { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 9px 12px; color: var(--text); font-size: 13.5px; font-family: var(--font); width: 100%; outline: none; transition: border-color 0.2s; } .s-input-field:focus { border-color: var(--accent); } .s-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 10px 16px; color: var(--text); font-size: 13.5px; font-family: var(--font); cursor: pointer; transition: background 0.15s, border-color 0.15s; display: flex; align-items: center; gap: 6px; } .s-btn:active { background: var(--surface); } .s-btn.accent { background: var(--accent); color: #0a1a14; border-color: var(--accent); font-weight: 600; } .s-btn.accent:active { opacity: 0.85; } .s-btn.danger { border-color: #f87171; color: #f87171; } .s-btn-row { display: flex; gap: 8px; flex-wrap: wrap; padding: 14px 16px; border-bottom: 1px solid var(--border); } .s-btn-row:last-child { border-bottom: none; } .s-sound-options { display: flex; gap: 8px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid var(--border); } .s-sound-options:last-child { border-bottom: none; } .s-sound-btn { padding: 7px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface2); color: var(--text2); font-size: 13px; cursor: pointer; transition: all 0.15s; } .s-sound-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(93,232,193,0.08); } .s-test-result { padding: 8px 16px 12px; font-size: 13px; display: none; } .s-test-result.ok  { color: var(--accent); } .s-test-result.err { color: #f87171; } .s-version { text-align: center; font-size: 12px; color: var(--text2); padding: 8px 0; }`;

export async function mount(container, headerRight, params) {
// 注入CSS（只注入一次）
if (!document.getElementById(‘css-settings’)) {
const style = document.createElement(‘style’);
style.id = ‘css-settings’;
style.textContent = CSS;
document.head.appendChild(style);
}

const s = State.settings;

container.innerHTML = `

  <div id="settings-root">

```
<!-- API配置 -->
<div class="s-section">
  <div class="s-section-title">API 配置</div>
  <div class="s-card">
    <div class="s-input-row">
      <div class="s-input-label">API 地址</div>
      <input class="s-input-field" id="cfg-url" type="url"
        placeholder="https://api.openai.com/v1"
        value="${escHtml(s.apiBaseUrl)}">
    </div>
    <div class="s-input-row">
      <div class="s-input-label">API Key</div>
      <input class="s-input-field" id="cfg-key" type="password"
        placeholder="sk-..."
        value="${escHtml(s.apiKey)}">
    </div>
    <div class="s-input-row">
      <div class="s-input-label">模型</div>
      <input class="s-input-field" id="cfg-model" type="text"
        placeholder="gpt-4o"
        value="${escHtml(s.model)}">
    </div>
    <div class="s-input-row">
      <div class="s-input-label">Temperature（创意度 0~2，推荐 0.9）</div>
      <input class="s-input-field" id="cfg-temp" type="number"
        min="0" max="2" step="0.1"
        value="${s.temperature}">
    </div>
    <div class="s-input-row">
      <div class="s-input-label">最大 Token 数</div>
      <input class="s-input-field" id="cfg-tokens" type="number"
        min="256" max="8192" step="256"
        value="${s.maxTokens}">
    </div>
    <div class="s-btn-row">
      <button class="s-btn accent" id="btn-save-api">💾 保存配置</button>
      <button class="s-btn" id="btn-test-api">🔌 测试连接</button>
    </div>
    <div class="s-test-result" id="test-result"></div>
  </div>
</div>

<!-- 提示音 -->
<div class="s-section">
  <div class="s-section-title">提示音</div>
  <div class="s-card">
    <div class="s-sound-options" id="sound-options">
      ${renderSoundOptions(s.notificationSound)}
    </div>
  </div>
</div>

<!-- 数据管理 -->
<div class="s-section">
  <div class="s-section-title">数据管理</div>
  <div class="s-card">
    <div class="s-btn-row">
      <button class="s-btn" id="btn-export">📦 导出全部数据</button>
    </div>
    <div class="s-btn-row">
      <button class="s-btn" id="btn-import">📂 导入数据</button>
      <input type="file" id="import-file" accept=".json" style="display:none">
    </div>
    <div class="s-btn-row">
      <button class="s-btn danger" id="btn-clear">⚠️ 清空所有数据</button>
    </div>
  </div>
</div>

<!-- 关于 -->
<div class="s-section">
  <div class="s-section-title">关于</div>
  <div class="s-card">
    <div class="s-row">
      <div class="s-row-icon" style="background:#1a1a2e">📱</div>
      <div class="s-row-body">
        <div class="s-row-label">AI Phone</div>
        <div class="s-row-sub">v0.1.0 · 基于 OpenAI 兼容接口</div>
      </div>
    </div>
  </div>
</div>
```

  </div>
  `;

// ── 事件绑定 ────────────────────────────────────────────

// 保存API配置
document.getElementById(‘btn-save-api’).addEventListener(‘click’, () => {
State.saveSettings({
apiBaseUrl:  document.getElementById(‘cfg-url’).value.trim().replace(//$/, ‘’),
apiKey:      document.getElementById(‘cfg-key’).value.trim(),
model:       document.getElementById(‘cfg-model’).value.trim(),
temperature: parseFloat(document.getElementById(‘cfg-temp’).value) || 0.9,
maxTokens:   parseInt(document.getElementById(‘cfg-tokens’).value) || 2048,
});
window.showToast(‘✅ 配置已保存’);
});

// 测试连接
document.getElementById(‘btn-test-api’).addEventListener(‘click’, async () => {
// 先保存当前输入的配置
State.saveSettings({
apiBaseUrl: document.getElementById(‘cfg-url’).value.trim().replace(//$/, ‘’),
apiKey:     document.getElementById(‘cfg-key’).value.trim(),
model:      document.getElementById(‘cfg-model’).value.trim(),
});

```
const btn = document.getElementById('btn-test-api');
const res = document.getElementById('test-result');
btn.textContent = '连接中...'; btn.disabled = true;
res.style.display = 'none';

try {
  const msg = await testConnection();
  res.textContent = '✅ 连接成功：' + msg.slice(0, 60);
  res.className = 's-test-result ok';
} catch (e) {
  res.textContent = '❌ ' + e.message;
  res.className = 's-test-result err';
} finally {
  res.style.display = 'block';
  btn.textContent = '🔌 测试连接'; btn.disabled = false;
}
```

});

// 提示音选择
document.getElementById(‘sound-options’).addEventListener(‘click’, e => {
const btn = e.target.closest(’.s-sound-btn’);
if (!btn) return;
const sound = btn.dataset.sound;
document.querySelectorAll(’.s-sound-btn’).forEach(b => b.classList.remove(‘active’));
btn.classList.add(‘active’);
State.saveSettings({ notificationSound: sound });
playSound(sound);
});

// 导出
document.getElementById(‘btn-export’).addEventListener(‘click’, () => {
const json = Storage.exportAll();
const blob = new Blob([json], { type: ‘application/json’ });
const url  = URL.createObjectURL(blob);
const a    = document.createElement(‘a’);
a.href     = url;
a.download = `aiphone_backup_${formatDate()}.json`;
a.click();
URL.revokeObjectURL(url);
window.showToast(‘📦 已导出备份文件’);
});

// 导入
document.getElementById(‘btn-import’).addEventListener(‘click’, () => {
document.getElementById(‘import-file’).click();
});
document.getElementById(‘import-file’).addEventListener(‘change’, async e => {
const file = e.target.files[0];
if (!file) return;
try {
const text = await file.text();
Storage.importAll(text);
await State.init();
Events.emit(‘home:refresh’);
Events.emit(‘theme:update’);
window.showToast(‘✅ 导入成功，数据已恢复’);
} catch (err) {
window.showToast(‘❌ 导入失败：’ + err.message);
}
e.target.value = ‘’;
});

// 清空数据
document.getElementById(‘btn-clear’).addEventListener(‘click’, () => {
if (!confirm(‘确定清空所有数据？此操作不可撤销！’)) return;
localStorage.clear();
window.showToast(‘已清空全部数据，即将刷新’);
setTimeout(() => location.reload(), 1500);
});

// 不需要清理
return null;
}

// ── 工具 ──────────────────────────────────────────────────────

const SOUNDS = [
{ id: ‘chime1’, label: ‘叮咚’ },
{ id: ‘chime2’, label: ‘清脆’ },
{ id: ‘soft’,   label: ‘柔和’ },
{ id: ‘none’,   label: ‘静音’ },
];

function renderSoundOptions(current) {
return SOUNDS.map(s =>
`<button class="s-sound-btn${s.id === current ? ' active' : ''}" data-sound="${s.id}">${s.label}</button>`
).join(’’);
}

function playSound(soundId) {
if (soundId === ‘none’) return;
// 用AudioContext生成简单提示音
try {
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain); gain.connect(ctx.destination);
osc.type = soundId === ‘soft’ ? ‘sine’ : ‘triangle’;
osc.frequency.value = soundId === ‘chime2’ ? 880 : 660;
gain.gain.setValueAtTime(0.3, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
osc.start(); osc.stop(ctx.currentTime + 0.5);
} catch {}
}

function formatDate() {
const d = new Date();
return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function escHtml(str) {
return String(str || ‘’).replace(/&/g,’&’).replace(/”/g,’"’).replace(/</g,’<’);
}
