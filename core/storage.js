var PFX = 'ap_';

export var Storage = {
  init: function() {
    try { localStorage.setItem('__t__','1'); localStorage.removeItem('__t__'); }
    catch(e) { console.warn('localStorage unavailable'); }
  },
  get: function(key, fallback) {
    if (fallback === undefined) fallback = null;
    try {
      var raw = localStorage.getItem(PFX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  },
  set: function(key, value) {
    try { localStorage.setItem(PFX + key, JSON.stringify(value)); }
    catch(e) { console.warn('storage write fail', key); }
  },
  remove: function(key) {
    localStorage.removeItem(PFX + key);
  },
  genId: function() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  },
  getContacts: function() { return this.get('contacts', []); },
  saveContacts: function(list) { this.set('contacts', list); },
  getContact: function(id) {
    return this.getContacts().find(function(c){ return c.id === id; }) || null;
  },
  upsertContact: function(contact) {
    var list = this.getContacts();
    var idx = list.findIndex(function(c){ return c.id === contact.id; });
    if (idx >= 0) list[idx] = contact; else list.push(contact);
    this.saveContacts(list);
  },
  deleteContact: function(id) {
    this.saveContacts(this.getContacts().filter(function(c){ return c.id !== id; }));
    this.remove('messages_' + id);
    this.remove('memory_' + id);
  },
  getMessages: function(cid) { return this.get('messages_' + cid, []); },
  saveMessages: function(cid, msgs) { this.set('messages_' + cid, msgs); },
  appendMessage: function(cid, msg) {
    var msgs = this.getMessages(cid);
    msgs.push(msg);
    this.saveMessages(cid, msgs);
  },
  removeLastAssistant: function(cid) {
    var msgs = this.getMessages(cid);
    for (var i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') { msgs.splice(i, 1); break; }
    }
    this.saveMessages(cid, msgs);
  },
  getMemory: function(cid) {
    return this.get('memory_' + cid, { importantEvents: [], summary: '', summaryAt: 0 });
  },
  saveMemory: function(cid, mem) { this.set('memory_' + cid, mem); },
  getWorldbook: function() { return this.get('worldbook', []); },
  saveWorldbook: function(list) { this.set('worldbook', list); },
  getMoments: function() { return this.get('moments', []); },
  saveMoments: function(list) { this.set('moments', list); },
  getStickers: function() { return this.get('stickers', { packs: [] }); },
  saveStickers: function(data) { this.set('stickers', data); },
  exportAll: function() {
    var data = { _version: 1, _exportedAt: new Date().toISOString() };
    var keys = ['settings','user','theme','appIcons','contacts','worldbook','moments','stickers'];
    var self = this;
    keys.forEach(function(k){ data[k] = self.get(k); });
    data._messages = {}; data._memory = {};
    this.getContacts().forEach(function(c){
      data._messages[c.id] = self.getMessages(c.id);
      data._memory[c.id]   = self.getMemory(c.id);
    });
    return JSON.stringify(data, null, 2);
  },
  importAll: function(jsonStr) {
    var data = JSON.parse(jsonStr);
    var keys = ['settings','user','theme','appIcons','contacts','worldbook','moments','stickers'];
    var self = this;
    keys.forEach(function(k){ if (data[k] !== undefined) self.set(k, data[k]); });
    if (data._messages) Object.keys(data._messages).forEach(function(id){ self.saveMessages(id, data._messages[id]); });
    if (data._memory)   Object.keys(data._memory).forEach(function(id){ self.saveMemory(id, data._memory[id]); });
  }
};
