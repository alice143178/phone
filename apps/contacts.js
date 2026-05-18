/**
 * apps/contacts.js
 * \u8054\u7cfb\u4eba\u5217\u8868 + \u89d2\u8272\u5361\u7ba1\u7406
 *
 * \u89d2\u8272\u5361\u5b57\u6bb5\u8bf4\u660e\uff1a
 *   id, name, avatar(base64), nickname(\u7528\u6237\u5907\u6ce8),
 *   gender, age, personality, background, speakingStyle,
 *   scenario, firstMessage, exampleDialogues,
 *   userNickname(\u89d2\u8272\u53eb\u7528\u6237\u7684\u79f0\u547c), userAvatar,
 *   momentsEnabled, momentsFrequency,
 *   locationHint, systemPromptOverride,
 *   importantMemories:[{id,text,ts,confirmed}],
 *   createdAt, updatedAt
 */
import { Storage } from '../core/storage.js';
import { Router }  from '../core/router.js';
import { Events }  from '../core/events.js';

export var META = { title: '\u8054\u7cfb\u4eba', hideHeader: false };

/* ============================================================
   CSS
============================================================ */
function injectCSS() {
  if (document.getElementById('css-contacts')) return;
  var s = document.createElement('style');
  s.id = 'css-contacts';
  s.textContent = [
    '#ct-root{height:100%;display:flex;flex-direction:column;background:var(--bg);}',
    '#ct-search-bar{padding:10px 14px 8px;flex-shrink:0;}',
    '#ct-search-input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:9px 14px;color:var(--text);font-size:14px;font-family:var(--font);outline:none;}',
    '#ct-search-input::placeholder{color:var(--text2);}',
    '#ct-list{flex:1;overflow-y:auto;padding-bottom:80px;}',
    '.ct-empty{text-align:center;padding:60px 24px;color:var(--text2);font-size:14px;line-height:2;}',
    '.ct-item{display:flex;align-items:center;padding:12px 16px;gap:12px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.12s;}',
    '.ct-item:active{background:var(--surface);}',
    '.ct-avatar{width:50px;height:50px;border-radius:16px;background:var(--surface2);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;}',
    '.ct-avatar img{width:100%;height:100%;object-fit:cover;border-radius:16px;}',
    '.ct-info{flex:1;min-width:0;}',
    '.ct-name{font-size:15px;font-weight:600;color:var(--text);}',
    '.ct-sub{font-size:12px;color:var(--text2);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.ct-arrow{color:var(--text2);font-size:18px;flex-shrink:0;}',
    '#ct-fab{position:absolute;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:var(--accent);border:none;color:#0a1a14;font-size:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(93,232,193,0.35);}',

    /* edit view */
    '#ct-edit-root{height:100%;overflow-y:auto;background:var(--bg);padding:0 0 40px;}',
    '.ce-section{margin:16px 14px 0;}',
    '.ce-section-title{font-size:11px;font-weight:700;color:var(--text2);letter-spacing:0.08em;text-transform:uppercase;padding:0 4px 8px;}',
    '.ce-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;}',
    '.ce-row{display:flex;align-items:center;padding:13px 16px;gap:12px;border-bottom:1px solid var(--border);min-height:50px;}',
    '.ce-row:last-child{border-bottom:none;}',
    '.ce-label{font-size:13px;color:var(--text2);flex-shrink:0;width:72px;}',
    '.ce-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:14px;font-family:var(--font);}',
    '.ce-input::placeholder{color:var(--text2);}',
    '.ce-textarea{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;color:var(--text);font-size:13.5px;font-family:var(--font);resize:none;outline:none;min-height:80px;transition:border-color 0.2s;}',
    '.ce-textarea:focus{border-color:var(--accent);}',
    '.ce-textarea-row{padding:12px 16px;border-bottom:1px solid var(--border);}',
    '.ce-textarea-row:last-child{border-bottom:none;}',
    '.ce-textarea-label{font-size:11px;color:var(--text2);font-weight:600;margin-bottom:6px;}',
    '.ce-avatar-row{display:flex;align-items:center;gap:16px;padding:16px;}',
    '.ce-avatar-big{width:72px;height:72px;border-radius:20px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:32px;overflow:hidden;cursor:pointer;border:2px dashed var(--border);}',
    '.ce-avatar-big img{width:100%;height:100%;object-fit:cover;border-radius:18px;}',
    '.ce-avatar-hint{font-size:12px;color:var(--text2);line-height:1.6;}',
    '.ce-btn{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 16px;color:var(--text);font-size:13.5px;font-family:var(--font);cursor:pointer;width:100%;}',
    '.ce-btn.accent{background:var(--accent);color:#0a1a14;border-color:var(--accent);font-weight:600;}',
    '.ce-btn.danger{border-color:#f87171;color:#f87171;}',
    '.ce-btn-row{padding:14px 16px;border-bottom:1px solid var(--border);}',
    '.ce-btn-row:last-child{border-bottom:none;}',
    '.ce-freq-opts{display:flex;gap:8px;flex-wrap:wrap;padding:12px 16px;}',
    '.ce-freq-btn{padding:7px 14px;border-radius:20px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);font-size:13px;cursor:pointer;}',
    '.ce-freq-btn.active{border-color:var(--accent);color:var(--accent);background:rgba(93,232,193,0.08);}',
    '.ce-mem-item{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);}',
    '.ce-mem-item:last-child{border-bottom:none;}',
    '.ce-mem-text{flex:1;font-size:13px;color:var(--text);line-height:1.5;}',
    '.ce-mem-del{background:none;border:none;color:var(--text2);font-size:18px;cursor:pointer;padding:0 4px;flex-shrink:0;}',
    '.ce-switch{position:relative;width:44px;height:24px;flex-shrink:0;}',
    '.ce-switch input{opacity:0;width:0;height:0;}',
    '.ce-switch-slider{position:absolute;inset:0;background:var(--surface2);border-radius:12px;cursor:pointer;transition:0.2s;border:1px solid var(--border);}',
    '.ce-switch input:checked + .ce-switch-slider{background:var(--accent);}',
    '.ce-switch-slider::before{content:"";position:absolute;width:18px;height:18px;left:2px;top:2px;border-radius:50%;background:white;transition:0.2s;}',
    '.ce-switch input:checked + .ce-switch-slider::before{transform:translateX(20px);}',
    '#ct-edit-root *{scrollbar-width:none;}',
  ].join('');
  document.head.appendChild(s);
}

/* ============================================================
   mount \u5165\u53e3
============================================================ */
export function mount(container, headerRight, params) {
  injectCSS();

  if (params && params.editId !== undefined) {
    return mountEdit(container, headerRight, params.editId);
  }
  return mountList(container, headerRight);
}

function mountList(container, headerRight) {
  var addBtn = document.createElement('button');
  addBtn.style.cssText = 'background:none;border:none;color:var(--accent);font-size:22px;cursor:pointer;padding:4px 8px;';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', function() { Router.open('contacts', { title: '\u65b0\u5efa\u89d2\u8272', editId: null }); });
  headerRight.appendChild(addBtn);
  container.innerHTML = '<div id="ct-root"><div id="ct-search-bar"><input id="ct-search-input" placeholder="\u641c\u7d22\u8054\u7cfb\u4eba..."></div><div id="ct-list"></div><button id="ct-fab">+</button></div>';
  renderList('');
  document.getElementById('ct-search-input').addEventListener('input', function(e) { renderList(e.target.value.trim()); });
  document.getElementById('ct-fab').addEventListener('click', function() { Router.open('contacts', { title: '\u65b0\u5efa\u89d2\u8272', editId: null }); });
  return null;
}

function renderList(query) {
  var list = document.getElementById('ct-list');
  if (!list) return;
  var contacts = Storage.getContacts();
  if (query) contacts = contacts.filter(function(c) { return c.name.indexOf(query) >= 0 || (c.nickname && c.nickname.indexOf(query) >= 0); });
  if (contacts.length === 0) { list.innerHTML = '<div class="ct-empty">\u8fd8\u6ca1\u6709\u8054\u7cfb\u4eba<br>\u70b9\u53f3\u4e0b\u89d2 + \u6dfb\u52a0\u7b2c\u4e00\u4e2a\u89d2\u8272</div>'; return; }
  list.innerHTML = contacts.map(function(c) {
    var ah = c.avatar ? '<img src="' + c.avatar + '">' : (c.name ? c.name.charAt(0) : '?');
    var msgs = Storage.getMessages(c.id);
    var last = msgs.length ? msgs[msgs.length-1] : null;
    var sub = last ? (last.role === 'user' ? '\u6211\uff1a' : '') + getPreview(last) : '\u70b9\u51fb\u5f00\u59cb\u804a\u5929';
    return '<div class="ct-item" data-id="'+c.id+'"><div class="ct-avatar">'+ah+'</div><div class="ct-info"><div class="ct-name">'+esc(c.nickname||c.name)+'</div><div class="ct-sub">'+esc(sub)+'</div></div><div class="ct-arrow">\u203a</div></div>';
  }).join('');
  list.querySelectorAll('.ct-item').forEach(function(el) {
    el.addEventListener('click', function() {
      var c = Storage.getContact(el.dataset.id);
      if (!c) return;
      Router.open('chat', {title:c.nickname||c.name,contactId:el.dataset.id});
    });
    var t;
    el.addEventListener('touchstart',function(){ t=setTimeout(function(){ Router.open('contacts',{title:'\u7f16\u8f91\u89d2\u8272',editId:el.dataset.id}); },600); });
    el.addEventListener('touchend',function(){clearTimeout(t);});
    el.addEventListener('touchmove',function(){ clearTimeout(t);});
  });
}

function getPreview(msg) {
  if (!msg.parts||!msg.parts.length) return '';
  var p=msg.parts[0];
  if(p.type==='talk') return p.content.slice(0,30);
  if(p.type==='action') return '['+p.content.slice(0,20)+']';
  if(p.type==='image') return '[\u56fe\u7247]';
  if(p.type==='sticker') return '[\u8868\u60c5\u5305]';
  if(p.type==='transfer') return '[\u8f6c\u8d26]';
  return '';
}

function mountEdit(container, headerRight, editId) {
  var isNew = !editId;
  var contact = isNew ? {id:Storage.genId(),name:'',avatar:null,nickname:'',gender:'',age:'',personality:'',background:'',speakingStyle:'',scenario:'',firstMessage:'',exampleDialogues:'',userNickname:'',userAvatar:null,momentsEnabled:true,momentsFrequency:'daily',importantMemories:[],locationHint:'',systemPromptOverride:'',createdAt:Date.now(),updatedAt:Date.now()}
  : Object.assign({},Storage.getContact(editId));
  if(!contact){container.innerHTML='<div style="padding:32px;color:#f87171">\u89d2\u8272\u4e0d\u5b58\u5728</div>';return null;}
  var saveBtn=document.createElement('button');
  saveBtn.style.cssText='background:none;border:none;color:var(--accent);font-size:15px;font-weight:600;cursor:pointer;padding:4px 8px;';
  saveBtn.textContent='\u4fdd\u5b58';
  headerRight.appendChild(saveBtn);
  var FREQ=[{id:'high',label:'\u9ad8\u9891'},{id:'daily',label:'\u6bcf\u65e5'},{id:'low',label:'\u4f4e\u9891'},{id:'manual',label:'\u4e0d\u81ea\u52a8'}];
  container.innerHTML=[
    '<div id="ct-edit-root">',
    '<div class="ce-section"><div class="ce-section-title">\u57fa\u672c\u4fe1\u606f</div><div class="ce-card">',
    '<div class="ce-avatar-row"><div class="ce-avatar-big" id="ce-avatar-btn">'+(contact.avatar?'<img id="ce-avatar-img" src="'+contact.avatar+'">':'<span id="ce-avatar-img">\uD83D\uDC64</span>')+'</div><input type="file" id="ce-avatar-file" accept="image/*" style="display:none"><div class="ce-avatar-hint">\u70b9\u51fb\u5934\u50cf\u66f4\u6362\u56fe\u7247</div></div>',
    '<div class="ce-row"><div class="ce-label">\u540d\u5b57</div><input class="ce-input" id="ce-name" value="'+esc(contact.name)+'"></div>',
    '<div class="ce-row"><div class="ce-label">\u5907\u6ce8</div><input class="ce-input" id="ce-nickname" placebolder="\u4e2a\u4eba\u5907\u6ce8" value="'+esc(contact.nickname||'')+'"></div>',
    '<div class="ce-row"><div class="ce-label">\u6027\u522b</div><input class="ce-input" id="ce-gender" placeholder="\u5973/\u7537" value="'+esc(contact.gender||'')+'"></div>',
    '<div class="ce-row"><div class="ce-label">\u5e74\u9f84</div><input class="ce-input" id="ce-age" placeholder="28\u5c81" value="'+esc(contact.age||'')+'"></div>','</div></div>',
    '<div class="ce-section"><div class="ce-section-title">\u4eba\u8bbe\u8bbe\u5b9a</div><div class="ce-card">',
    '<div class="ce-textarea-row"><div class="ce-textarea-label">\u6027\u683c\u63cf\u8ff0</div><textarea class="ce-textarea" id="ce-personality" rows="4">'+esc(contact.personality||'')+'</textarea></div>',
    '<div class="ce-textarea-row"><div class="ce-textarea-label">\u80cc\u666f\u8bbe\u5b9a</div><textarea class="ce-textarea" id="ce-background" rows="4">'+esc(contact.background||'')+'</textarea></div>',
    '<div class="ce-textarea-row"><div class="ce-textarea-label">\u8bf4\u8bdd\u98ce\u683c</div><textarea class="ce-textarea" id="ce-speaking" rows="3">'+esc(contact.speakingStyle||'')+'</textarea></div>',
    '<div class="ce-textarea-row"><div class="ce-textarea-label">\u5f53\u524d\u573a\u666f</div><textarea class="ce-textarea" id="ce-scenario" rows="3">'+esc(contact.scenario||'')+'</textarea></div>',
    '<div class="ce-textarea-row"><div class="ce-textarea-label">\u5f00\u573a\u767d</div><textarea class="ce-textarea" id="ce-firstmsg" rows="4">'+esc(contact.firstMessage||'')+'</textarea></div>',
    '<div class="ce-textarea-row"><div class="ce-textarea-label">\u793a\u4f8b\u5bf9\u8bdd</div><textarea class="ce-textarea" id="ce-examples" rows="6">'+esc(contact.exampleDialogues||'')+'</textarea></div>',
    '</div></div>',
    '<div class="ce-section"><div class="ce-section-title">\u804a\u5929\u8bbe\u5b9a</div><div class="ce-card"><div class="ce-row"><div class="ce-label">user\u79f0\u547c</div><input class="ce-input" id="ce-usernick" value="'+esc(contact.userNickname||'')+'"></div><div class="ce-row"><div class="ce-label">\u5730\u70b9\u63d0\u793a</div><input class="ce-input" id="ce-location" value="'+esc(contact.locationHint||'')+'"></div></div></div>',
    '<div class="ce-section"><div class="ce-section-title">\u63d0\u793a\u8bcd\u8986\u76d6(\u9ad8\u7ea7)</div><div class="ce-card"><div class="ce-textarea-row"><div class="ce-textarea-label">\u81ea\u5b9a\u4e49 System Prompt</div><textarea class="ce-textarea" id="ce-sysprompt" rows="4">'+esc(contact.systemPromptOverride||'')+'</textarea></div></div></div>',
    '<div class="ce-section"><div class="ce-section-title">\u670b\u53cb\u5708</div><div class="ce-card"><div class="ce-row"><div class="ce-label">\u81ea\u52a8\u53d1\u5e16</div><div style="flex:1"></div><label class="ce-switch"><input type="checkbox" id="ce-moments-on"'+(contact.momentsEnabled?' checked':'')+'><span class="ce-switch-slider"></span></label></div><div class="ce-freq-opts" id="ce-freq-opts">',
    FREQ.map(function(f){return '<button class="ce-freq-btn'+(contact.momentsFrequency===f.id?' active':'')+'" data-freq="'+f.id+'">'+f.label+'</button>';}).join(''),
    '</div></div></div>',
    '<div class="ce-section"><div class="ce-section-title">\u91cd\u8981\u8bb0\u5fc6</div><div class="ce-card"><div id="ce-mem-list">'+renderMemList(contact.importantMemories||[])+'</div><div class="ce-btn-row"><button class="ce-btn" id="ce-add-mem">\u624b\u52a8\u6dfb\u52a0\u8bb0\u5fc6</button></div></div></div>',
    '<div class="ce-section"><div class="ce-section-title">\u5bfc\u5165 / \u5bfc\u51fa</div><div class="ce-card"><div class="ce-btn-row"><button class="ce-btn" id="ce-import-st">\u5bfc\u5165\u9152\u9986 JSON\u89d2\u8272\u5361</button></div><input type="file" id="ce-import-file" accept=".json,.png" style="display:none"><div class="ce-btn-row"><button class="ce-btn" id="ce-export-card">\u5bfc\u51fa\u89d2\u8272\u5361 JSON</button></div>',
    isNew?'':'<div class="ce-btn-row"><button class="ce-btn danger" id="ce-delete-card">\u5220\u9664\u6b64\u89d2\u8272</button></div>',
    '</div></div></div>',
  ].join('');

  document.getElementById('ce-avatar-btn').addEventListener('click',function(){document.getElementById('ce-avatar-file').click();});
  document.getElementById('ce-avatar-file').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;Var r=new FileReader();r.onload=function(ev){contact.avatar=ev.target.result;var el=document.getElementById('ce-avatar-img');if(el.tagName==='IMG')el.src=contact.avatar;else{var i=document.createElement('img');i.id='ce-avatar-img';i.src=contact.avatar;el.parentNode.replaceChild(i,el);}};r.readAsDataURL(f);e.target.value='';});
  document.getElementById('ce-freq-opts').addEventListener('click',function(e){var b=e.target.closest('.ce-freq-btn');if(!b)return;document.querySelectorAll('.ce-freq-btn').forEach(function(x){x.classList.remove('active');});b.classList.add('active');contact.momentsFrequency=b.dataset.freq;});
  document.getElementById('ce-add-mem').addEventListener('click',function(){var t=prompt('\u8bb0\u5fc6\u5185\u53c9');if(!t||!t.trim())return;if(!contact.importantMemories)contact.importantMemories=[];contact.importantMemories.push({id:Storage.genId(),text:t.trim(),ts:Date.now(),confirmed:true});document.getElementById('ce-mem-list').innerHTML=renderMemList(contact.importantMemories);});
  document.getElementById('ce-import-st').addEventListener('click',function(){document.getElementById('ce-import-file').click();});
  document.getElementById('ce-import-file').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){try{var d=JSON.parse(ev.target.result);importSTCard(contact,d);setField('ce-name',contact.name);setField('ce-personality',contact.personality);setField('ce-background',contact.background);setField('ce-scenario',contact.scenario);setField('ce-firstmsg',contact.firstMessage);setField('ce-examples',contact.exampleDialogues);setField('ce-speaking',contact.speakingStyle);window.showToast('\u5bfc\u5165\u6210\u529f')~catch(er){window.showToast('\u89e3\u6790\u5931\u8d25:'+er.message)}};r.readAsText(f);e.target.value='';});
  document.getElementById('ce-export-card').addEventListener('click',function(){collectFields(contact);var j=JSON.stringify(exportSTCard(contact),null,2);var b=new Blob([j],{type:'application/json'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download=(contact.name||'char')+'_card.json';a.click();URL.revokeObjectURL(u;window.showToast('\u5bfc\u51fa\u6210\u529f');});
  if(!isNew)document.getElementById('ce-delete-card').addEventListener('click',function(){if(!confirm('\u786e\u5b9a\u5220\u9664?'))return;Storage.deleteContact(contact.id);Events.emit('contacts:update');Router.back();window.showToast('\u5df2\u5220\u9664');});
  saveBtn.addEventListener('click',function(){collectFields(contact);if(!contact.name.trim()){window.showToast('\u8bf7\u586b\u5199\u540d\u5b57');return;}contact.updatedAt=Date.now();Storage.upsertContact(contact);Events.emit('contacts:update');Router.back();window.showToast('\u5df2\u4fdd\u5b58');});
  return null;
}

function collectFields(c){c.name=val('ce-name');c.nickname=val('ce-nickname');c.gender=val('ce-gender');c.age=val('ce-age');c.personality=val('ce-personality');c.background=val('ce-background');c.speakingStyle=val('ce-speaking');c.scenario=val('ce-scenario');c.firstMessage=val('ce-firstmsg');c.exampleDialogues=val('ce-examples');c.userNickname=val('ce-usernick');c.locationHint=val('ce-location');c.systemPromptOverride=val('ce-sysprompt');var sw=document.getElementById('ce-moments-on');if(sw)c.momentsEnabled=sw.checked;}
function val(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function setField(id,v){var e=document.getElementById(id);if(e)e.value=v||'';}
function renderMemList(m){if(!m||!m.length)return '<div style="padding:14px 16px;color:var(--text2)">\u8fd8\u6ca1\u6709\u91cd\u8981\u8bb0\u5fc6</div>';return m.map(function(x,i){return '<div class="ce-mem-item"><div class="ce-mem-text">'+esc(x.text)+'</div><button class="ce-mem-del" data-idx="'+i+'">\u00d7</button></div>';}).join('');}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function importSTCard(c,d){var x=(d.spec==='chara_card_v2'&&d.data)?d.data:d;c.name=x.name||c.name;c.personality=x.personality||x.description||c.personality;c.background=x.scenario||c.background;c.scenario=x.scenario||c.scenario;c.firstMessage=x.first_mes||c.firstMessage;c.exampleDialogues=x.mes_example||c.exampleDialogues;c.systemPromptOverride=x.system_prompt||c.systemPromptOverride;if(x.extensions)c.locationHint=x.extensions.world||'';}
function exportSTCard(c){return{spec:'chara_card_v2+spec_version:'2.0',data:{name:c.name,description:c.personality,personality:c.personality,scenario:c.scenario||c.background,first_mes:c.firstMessage,mes_example:c.exampleDialogues,system_prompt:c.systemPromptOverride,creator_notes:'se.From AI Phone',extensions:{world:c.locationHint||''}}};}
