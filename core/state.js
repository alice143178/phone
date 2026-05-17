import { Storage } from './storage.js';

var DEF_SETTINGS = {
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.9,
  maxTokens: 2048,
  notificationSound: 'chime1'
};

var DEF_USER = { name: 'User', avatar: null, bio: '', personas: [] };

var DEF_THEME = {
  accentColor: '#5de8c1',
  bgColor: null,
  wallpaper: null,
  chatWallpaper: null,
  bubbleUser: '#1e4a6e',
  bubbleAi: '#1e2535',
  fontSize: 14,
  fontFamily: '',
  customCSS: ''
};

function merge(def, saved) {
  if (!saved) return Object.assign({}, def);
  return Object.assign({}, def, saved);
}

export var State = {
  settings: Object.assign({}, DEF_SETTINGS),
  user:     Object.assign({}, DEF_USER),
  theme:    Object.assign({}, DEF_THEME),
  appIcons: {},

  init: function() {
    this.settings = merge(DEF_SETTINGS, Storage.get('settings'));
    this.user     = merge(DEF_USER,     Storage.get('user'));
    this.theme    = merge(DEF_THEME,    Storage.get('theme'));
    this.appIcons = Storage.get('appIcons') || {};
  },

  saveSettings: function(patch) {
    Object.assign(this.settings, patch);
    Storage.set('settings', this.settings);
  },
  saveUser: function(patch) {
    Object.assign(this.user, patch);
    Storage.set('user', this.user);
  },
  saveTheme: function(patch) {
    Object.assign(this.theme, patch);
    Storage.set('theme', this.theme);
  },
  getAppIcon: function(id) { return this.appIcons[id] || null; },
  setAppIcon: function(id, val) {
    if (val) this.appIcons[id] = val; else delete this.appIcons[id];
    Storage.set('appIcons', this.appIcons);
  },
  resetSettings: function() {
    this.settings = Object.assign({}, DEF_SETTINGS);
    Storage.set('settings', this.settings);
  },
  resetTheme: function() {
    this.theme = Object.assign({}, DEF_THEME);
    Storage.set('theme', this.theme);
  }
};
