var _listeners = {};

export var Events = {
  on: function(event, cb) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(cb);
  },
  off: function(event, cb) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function(f){ return f !== cb; });
  },
  emit: function(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].slice().forEach(function(cb){
      try { cb(data); } catch(e) { console.error('event error', event, e); }
    });
  },
  once: function(event, cb) {
    var self = this;
    var w = function(data){ cb(data); self.off(event, w); };
    this.on(event, w);
  }
};
