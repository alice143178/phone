/**

- core/storage.js
- localStorage 读写封装 + 全量导入/导出
- 所有key统一加前缀 “ap_”，避免和其他页面冲突
  */

const PREFIX = ‘ap_’;

export const Storage = {

init() {
// 测试localStorage是否可用
try {
localStorage.setItem(’**test**’, ‘1’);
localStorage.removeItem(’**test**’);
} catch (e) {
console.warn(‘localStorage不可用，数据无法持久化’);
}
},

// ── 基础读写 ──────────────────────────────────────────────

get(key, fallback = null) {
try {
const raw = localStorage.getItem(PREFIX + key);
return raw !== null ? JSON.parse(raw) : fallback;
} catch { return fallback; }
},

set(key, value) {
try {
localStorage.setItem(PREFIX + key, JSON.stringify(value));
} catch (e) {
console.warn(‘Storage写入失败:’, key, e);
}
},

remove(key) {
localStorage.removeItem(PREFIX + key);
},

// ── 联系人（角色卡） ──────────────────────────────────────

getContacts() {
return this.get(‘contacts’, []);
},
saveContacts(contacts) {
this.set(‘contacts’, contacts);
},
getContact(id) {
return this.getContacts().find(c => c.id === id) || null;
},
upsertContact(contact) {
const list = this.getContacts();
const idx = list.findIndex(c => c.id === contact.id);
if (idx >= 0) list[idx] = contact;
else list.push(contact);
this.saveContacts(list);
},
deleteContact(id) {
const list = this.getContacts().filter(c => c.id !== id);
this.saveContacts(list);
this.remove(`messages_${id}`);
this.remove(`memory_${id}`);
this.remove(`summary_${id}`);
},

// ── 消息 ──────────────────────────────────────────────────
// 每个联系人一个key，存储完整消息数组
// 消息格式：{ id, role:‘user’|‘assistant’, parts:[{type,content}], ts, read }
// parts类型：‘talk’|‘action’|‘image’|‘sticker’|‘transfer’|‘dice’

getMessages(contactId) {
return this.get(`messages_${contactId}`, []);
},
saveMessages(contactId, messages) {
this.set(`messages_${contactId}`, messages);
},
appendMessage(contactId, msg) {
const msgs = this.getMessages(contactId);
msgs.push(msg);
this.saveMessages(contactId, msgs);
},
// 删除最后一条AI消息（重回功能）
removeLastAssistant(contactId) {
const msgs = this.getMessages(contactId);
for (let i = msgs.length - 1; i >= 0; i–) {
if (msgs[i].role === ‘assistant’) {
msgs.splice(i, 1);
break;
}
}
this.saveMessages(contactId, msgs);
},

// ── 记忆系统 ──────────────────────────────────────────────

getMemory(contactId) {
return this.get(`memory_${contactId}`, {
importantEvents: [],  // 重要事件列表 [{id, text, ts, confirmed}]
summary: ‘’,          // 最新自动总结
summaryAt: 0,         // 总结时消息数
});
},
saveMemory(contactId, memory) {
this.set(`memory_${contactId}`, memory);
},

// ── 世界书 ────────────────────────────────────────────────
// 每条entry: { id, title, content, global, charIds:[], enabled }

getWorldbook() {
return this.get(‘worldbook’, []);
},
saveWorldbook(entries) {
this.set(‘worldbook’, entries);
},

// ── 朋友圈 ────────────────────────────────────────────────
// 每条post: { id, charId, content, images:[], ts, likes:[], comments:[] }

getMoments() {
return this.get(‘moments’, []);
},
saveMoments(posts) {
this.set(‘moments’, posts);
},

// ── 表情包 ────────────────────────────────────────────────
// { packs: [{id, name, stickers:[{id, url, alt, isGif}]}] }

getStickers() {
return this.get(‘stickers’, { packs: [] });
},
saveStickers(data) {
this.set(‘stickers’, data);
},

// ── 全量导出 ──────────────────────────────────────────────
exportAll() {
const data = { _version: 1, _exportedAt: new Date().toISOString() };
const keys = [‘settings’,‘user’,‘theme’,‘appIcons’,‘contacts’,‘worldbook’,‘moments’,‘stickers’];
keys.forEach(k => { data[k] = this.get(k); });

```
// 导出所有联系人的消息和记忆
const contacts = this.getContacts();
data._messages = {};
data._memory   = {};
contacts.forEach(c => {
  data._messages[c.id] = this.getMessages(c.id);
  data._memory[c.id]   = this.getMemory(c.id);
});

return JSON.stringify(data, null, 2);
```

},

// ── 全量导入 ──────────────────────────────────────────────
importAll(jsonStr) {
let data;
try { data = JSON.parse(jsonStr); } catch { throw new Error(‘JSON格式错误’); }

```
const keys = ['settings','user','theme','appIcons','contacts','worldbook','moments','stickers'];
keys.forEach(k => { if (data[k] !== undefined) this.set(k, data[k]); });

if (data._messages) {
  Object.entries(data._messages).forEach(([id, msgs]) => {
    this.saveMessages(id, msgs);
  });
}
if (data._memory) {
  Object.entries(data._memory).forEach(([id, mem]) => {
    this.saveMemory(id, mem);
  });
}
```

},

// ── 工具 ──────────────────────────────────────────────────
// 生成唯一ID
genId() {
return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
},
};
