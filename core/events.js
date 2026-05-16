/**

- core/events.js
- 全局事件总线 —— 用于App之间通信
- 
- 内置事件列表（方便查阅）：
- router:open     { appId, params }
- router:back     { appId }
- router:home
- theme:update
- home:refresh
- contacts:update
- moments:new     { post }        朋友圈新帖 → 聊天感知
- chat:moment     { contactId, postId }  聊天中提到朋友圈
- memory:update   { contactId }
  */

const _listeners = {};

export const Events = {

/**

- 订阅事件
- @param {string}   event
- @param {Function} callback
  */
  on(event, callback) {
  if (!_listeners[event]) _listeners[event] = [];
  _listeners[event].push(callback);
  },

/**

- 取消订阅
  */
  off(event, callback) {
  if (!_listeners[event]) return;
  _listeners[event] = _listeners[event].filter(cb => cb !== callback);
  },

/**

- 发布事件
- @param {string} event
- @param {any}    data
  */
  emit(event, data) {
  if (!_listeners[event]) return;
  // 复制一份，避免回调中修改listeners导致问题
  […_listeners[event]].forEach(cb => {
  try { cb(data); } catch (e) { console.error(`事件[${event}]回调出错:`, e); }
  });
  },

/**

- 只监听一次
  */
  once(event, callback) {
  const wrapper = (data) => {
  callback(data);
  this.off(event, wrapper);
  };
  this.on(event, wrapper);
  },
  };
