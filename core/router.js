import { Events } from './events.js';

var _moduleCache = {};
var _stack = [];
var _cleanup = null;

function runCleanup() {
  if (typeof _cleanup === 'function') {
    try { _cleanup(); } catch(e) {}
    _cleanup = null;
  }
  return Promise.resolve();
}

function loadModule(appId) {
  if (_moduleCache[appId]) return Promise.resolve(_moduleCache[appId]);
  return import('../apps/' + appId + '.js').then(function(mod) {
    _moduleCache[appId] = mod;
    return mod;
  }).catch(function(e) {
    console.error('load app failed: ' + appId, e);
    return null;
  });
}

function showAppLayer() {
  var layer = document.getElementById('appLayer');
  layer.classList.remove('closing');
  void layer.offsetWidth;
  layer.classList.add('visible');
}

function hideAppLayer() {
  var layer = document.getElementById('appLayer');
  layer.classList.add('closing');
  setTimeout(function() {
    layer.classList.remove('visible','closing');
  }, 300);
}

function setHeader(mod, params) {
  var meta = (mod && mod.META) || {};
  var title = (params && params.title) || meta.title || '';
  document.getElementById('appHeaderTitle').textContent = title;
  document.getElementById('appHeaderRight').innerHTML = '';
  document.getElementById('appHeader').style.display = meta.hideHeader ? 'none' : 'flex';
}

export var Router = {
  init: function(apps) {},

  open: function(appId, params) {
    params = params || {};
    var self = this;
    return runCleanup().then(function() {
      return loadModule(appId);
    }).then(function(mod) {
      if (!mod) { window.showToast('App加载失败'); return; }
      setHeader(mod, params);
      var content = document.getElementById('appContent');
      content.innerHTML = '';
      var headerRight = document.getElementById('appHeaderRight');
      return Promise.resolve().then(function() {
        return mod.mount(content, headerRight, params);
      }).then(function(cleanup) {
        _cleanup = cleanup || null;
        _stack.push({ appId: appId, params: params });
        showAppLayer();
        Events.emit('router:open', { appId: appId, params: params });
      }).catch(function(e) {
        console.error('mount failed: ' + appId, e);
        content.innerHTML = '<div style="padding:32px;color:#f87171;text-align:center">加载失败<br><small>' + e.message + '</small></div>';
        _cleanup = null;
        _stack.push({ appId: appId, params: params });
        showAppLayer();
      });
    });
  },

  back: function() {
    var self = this;
    if (_stack.length <= 1) { return this.home(); }
    return runCleanup().then(function() {
      _stack.pop();
      var prev = _stack[_stack.length - 1];
      return loadModule(prev.appId).then(function(mod) {
        if (!mod) { return self.home(); }
        setHeader(mod, prev.params);
        var content = document.getElementById('appContent');
        content.innerHTML = '';
        return Promise.resolve().then(function() {
          return mod.mount(content, document.getElementById('appHeaderRight'), prev.params);
        }).then(function(cleanup) {
          _cleanup = cleanup || null;
          Events.emit('router:back', { appId: prev.appId });
        });
      });
    });
  },

  home: function() {
    return runCleanup().then(function() {
      _stack = [];
      _cleanup = null;
      hideAppLayer();
      Events.emit('router:home');
    });
  },

  currentApp: function() {
    return _stack.length ? _stack[_stack.length-1].appId : null;
  },

  setTitle: function(title) {
    document.getElementById('appHeaderTitle').textContent = title;
  }
};
