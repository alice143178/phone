/**

- core/state.js
- 全局状态管理 —— 所有模块通过 State 读写运行时数据
- 持久化数据由 Storage 负责，State 是内存层
  */
  import { Storage } from ‘./storage.js’;

const DEFAULT_SETTINGS = {
apiBaseUrl:        ‘https://api.openai.com/v1’,
apiKey:            ‘’,
model:             ‘gpt-4o’,
temperature:       0.9,
maxTokens:         2048,
notificationSound: ‘chime1’,  // ‘chime1’ | ‘chime2’ | ‘soft’ | ‘none’
};

const DEFAULT_USER = {
name:    ‘用户’,
avatar:  null,   // base64 or null
bio:     ‘’,
// 面具列表（每个char对应一个面具，但内容可改）
personas: [],    // [{ id, charId, name, avatar, bio }]
};

const DEFAULT_THEME = {
accentColor:    ‘#5de8c1’,
bgColor:        null,     // null = 用默认渐变
wallpaper:      null,     // base64 or url
chatWallpaper:  null,
bubbleUser:     ‘#1e4a6e’,
bubbleAi:       ‘#1e2535’,
fontSize:       14,
fontFamily:     ‘’,       // 空=系统默认
customCSS:      ‘’,
};

export const State = {
// 运行时数据
settings: { …DEFAULT_SETTINGS },
user:     { …DEFAULT_USER },
theme:    { …DEFAULT_THEME },

// App图标自定义（{ appId: base64 }）
appIcons: {},

// 初始化：从Storage加载所有持久化数据
async init() {
this.settings = { …DEFAULT_SETTINGS, …Storage.get(‘settings’) };
this.user     = { …DEFAULT_USER,     …Storage.get(‘user’) };
this.theme    = { …DEFAULT_THEME,    …Storage.get(‘theme’) };
this.appIcons = Storage.get(‘appIcons’) || {};
},

// ── Settings ──────────────────────────────────────────────
saveSettings(patch) {
Object.assign(this.settings, patch);
Storage.set(‘settings’, this.settings);
},

// ── User ──────────────────────────────────────────────────
saveUser(patch) {
Object.assign(this.user, patch);
Storage.set(‘user’, this.user);
},

// ── Theme ─────────────────────────────────────────────────
saveTheme(patch) {
Object.assign(this.theme, patch);
Storage.set(‘theme’, this.theme);
},

// ── App图标 ───────────────────────────────────────────────
getAppIcon(appId) {
return this.appIcons[appId] || null;
},
setAppIcon(appId, base64OrNull) {
if (base64OrNull) this.appIcons[appId] = base64OrNull;
else delete this.appIcons[appId];
Storage.set(‘appIcons’, this.appIcons);
},

// ── 重置为默认 ────────────────────────────────────────────
resetSettings() {
this.settings = { …DEFAULT_SETTINGS };
Storage.set(‘settings’, this.settings);
},
resetTheme() {
this.theme = { …DEFAULT_THEME };
Storage.set(‘theme’, this.theme);
},
};
