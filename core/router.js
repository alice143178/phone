/**

- core/router.js
- App导航管理：打开/关闭App、历史栈、过渡动画
- 
- 每个App模块需要导出：
- export async function mount(container, headerRight, params) { … }
- → 返回 cleanup 函数（可选）
- export const META = { title: ‘App名称’, hideHeader: false }
  */
  import { Events } from ‘./events.js’;

// App模块缓存（避免重复import）
const _moduleCache = {};

// 导航历史栈 [{appId, params}]
let _stack = [];

// 当前App的清理函数
let _cleanup = null;

// App列表（由 index.html boot时注册）
let _apps = [];

export const Router = {

// ── 初始化 ──────────────────────────────────────────────
init(apps) {
_apps = apps;
},

// ── 打开App ─────────────────────────────────────────────
async open(appId, params = {}) {
// 清理上一个App
await _runCleanup();

```
// 动态加载App模块
const mod = await _loadModule(appId);
if (!mod) { window.showToast('App加载失败'); return; }

// 设置标题栏
const meta = mod.META || {};
const title = params.title || meta.title || '';
document.getElementById('appHeaderTitle').textContent = title;

// 清空右侧按钮槽
const headerRight = document.getElementById('appHeaderRight');
headerRight.innerHTML = '';

// 根据 hideHeader 决定是否隐藏标题栏
const appHeader = document.getElementById('appHeader');
appHeader.style.display = meta.hideHeader ? 'none' : 'flex';

// 清空内容区
const content = document.getElementById('appContent');
content.innerHTML = '';

// 调用App的mount，传入内容容器和右侧按钮槽
try {
  _cleanup = await mod.mount(content, headerRight, params) || null;
} catch (e) {
  console.error(`App [${appId}] mount失败:`, e);
  content.innerHTML = `<div style="padding:32px;color:#f87171;text-align:center">
    加载失败<br><small>${e.message}</small></div>`;
  _cleanup = null;
}

// 推入历史
_stack.push({ appId, params });

// 显示App层（滑入动画）
_showAppLayer();

Events.emit('router:open', { appId, params });
```

},

// ── 返回 ────────────────────────────────────────────────
async back() {
if (_stack.length <= 1) {
this.home();
return;
}

```
await _runCleanup();
_stack.pop();

// 恢复上一个App
const prev = _stack[_stack.length - 1];
const mod = await _loadModule(prev.appId);
if (!mod) { this.home(); return; }

const meta = mod.META || {};
document.getElementById('appHeaderTitle').textContent = prev.params.title || meta.title || '';
document.getElementById('appHeaderRight').innerHTML = '';
document.getElementById('appHeader').style.display = meta.hideHeader ? 'none' : 'flex';

const content = document.getElementById('appContent');
content.innerHTML = '';

try {
  _cleanup = await mod.mount(content, document.getElementById('appHeaderRight'), prev.params) || null;
} catch (e) {
  console.error(`App [${prev.appId}] 恢复失败:`, e);
  _cleanup = null;
}

Events.emit('router:back', { appId: prev.appId });
```

},

// ── 回主屏 ──────────────────────────────────────────────
async home() {
await _runCleanup();
_stack = [];
_cleanup = null;
_hideAppLayer();
Events.emit(‘router:home’);
},

// ── 当前AppId ───────────────────────────────────────────
currentApp() {
return _stack.length ? _stack[_stack.length - 1].appId : null;
},

// ── 在当前App内切换子页面（不改变标题栏，重新mount） ───
async replace(appId, params = {}) {
await _runCleanup();
_stack[_stack.length - 1] = { appId, params };
const mod = await _loadModule(appId);
if (!mod) return;
const meta = mod.META || {};
document.getElementById(‘appHeaderTitle’).textContent = params.title || meta.title || ‘’;
document.getElementById(‘appHeaderRight’).innerHTML = ‘’;
const content = document.getElementById(‘appContent’);
content.innerHTML = ‘’;
try {
_cleanup = await mod.mount(content, document.getElementById(‘appHeaderRight’), params) || null;
} catch(e) { _cleanup = null; }
},

// ── 更新标题（App内调用） ──────────────────────────────
setTitle(title) {
document.getElementById(‘appHeaderTitle’).textContent = title;
},
};

// ── 私有工具 ──────────────────────────────────────────────────

async function _loadModule(appId) {
if (_moduleCache[appId]) return _moduleCache[appId];
try {
// 动态import，路径相对于index.html
const mod = await import(`../apps/${appId}.js`);
_moduleCache[appId] = mod;
return mod;
} catch (e) {
console.error(`加载App模块 [${appId}] 失败:`, e);
return null;
}
}

async function _runCleanup() {
if (typeof _cleanup === ‘function’) {
try { await _cleanup(); } catch {}
_cleanup = null;
}
}

function _showAppLayer() {
const layer = document.getElementById(‘appLayer’);
layer.classList.remove(‘closing’);
// 强制重排后加visible，触发过渡动画
void layer.offsetWidth;
layer.classList.add(‘visible’);
}

function _hideAppLayer() {
const layer = document.getElementById(‘appLayer’);
layer.classList.add(‘closing’);
// 动画结束后移除visible
setTimeout(() => {
layer.classList.remove(‘visible’, ‘closing’);
}, 300);
}
