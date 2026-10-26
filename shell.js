/* EMELCO shared shell
   One top bar, one login and same-tab navigation for every module.
   Change anything here once and all pages follow.

   Each page needs only:
     <div id="emelco-bar" data-page="billing" data-sub="Service invoices &amp; collections"></div>
     a script tag with src="shell.js" right after it
   and, if it has a data refresh, EM.onSync = function(){ ... };            */
(function(){
'use strict';

/* Management stays signed in until the tab/browser closes (same rule the Dashboard and
   Expenses used before). Set to true to remember Management on the device instead. */
var PERSIST_MGMT = false;

/* Modules shown in the top bar, in order. mgmtOnly = hidden for Operations. */
var MODS = [
  {k:'dashboard',  label:'Dashboard',  href:'dashboard.html',  desc:'Overview'},
  {k:'trips',      label:'Trips',      href:'index.html',      desc:'Trip list, payroll and fuel'},
  {k:'assignment', label:'Assignment', href:'assignment.html', desc:'Weekly truck assignment'},
  {k:'billing',    label:'Billing',    href:'billing.html',    desc:'Service invoices and collections', mgmtOnly:true},
  {k:'fleet',      label:'Fleet',      href:'fleet.html',      desc:'Registry and maintenance'},
  {k:'expenses',   label:'Expenses',   href:'expenses.html',   desc:'Operating expenses'}
];

var KEY_M = 'emelco_session_mgmt';   // Management session (internal role name: owner)
var KEY_O = 'emelco_session_ops';    // Operations session
var KEY_NAME = 'emelco_user_name';   // last signed-in name (modules use it for the record / deploy rights)

function mgmtStore(){ return PERSIST_MGMT ? localStorage : sessionStorage; }

function getSession(){
  try{
    var m = mgmtStore().getItem(KEY_M);
    if(m) return {role:'owner', name:m};
    var o = localStorage.getItem(KEY_O);
    if(o) return {role:'operations', name:o};
  }catch(e){}
  return null;
}

function setSession(role, name){
  try{
    if(role === 'owner'){
      mgmtStore().setItem(KEY_M, name);
      localStorage.removeItem(KEY_O);
    }else{
      localStorage.setItem(KEY_O, name);
      sessionStorage.removeItem(KEY_M);
      localStorage.removeItem(KEY_M);
    }
    localStorage.setItem(KEY_NAME, name);
  }catch(e){}
}

function clearSession(){
  try{
    sessionStorage.removeItem(KEY_M); localStorage.removeItem(KEY_M); localStorage.removeItem(KEY_O);
    /* keys used by the old per-module logins */
    localStorage.removeItem('emelco_role'); localStorage.removeItem('emelco_exp_role'); localStorage.removeItem('emelco_dash_ops');
    sessionStorage.removeItem('emelco_exp_owner'); sessionStorage.removeItem('emelco_dash_owner');
  }catch(e){}
}

function roleLabel(r){ return r === 'owner' ? 'Management' : 'Operations'; }
function currentFile(){ var f = location.pathname.split('/').pop(); return f || 'index.html'; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

/* Only our own page names are accepted as a "go back to" target. */
function safeNext(f){
  f = String(f || '');
  for(var i = 0; i < MODS.length; i++){ if(MODS[i].href === f) return f; }
  return null;
}

/* Called by every module except the Dashboard: no session -> send to the front door. */
function guard(){
  var s = getSession();
  if(s) return s;
  try{ document.documentElement.style.visibility = 'hidden'; }catch(e){}
  location.replace('dashboard.html?next=' + encodeURIComponent(currentFile()));
  return null;
}

function logoff(){
  if(!confirm('Log off from EMELCO?')) return;
  location.href = 'dashboard.html?logoff=1';
}

function sync(){
  if(typeof EM.onSync === 'function') EM.onSync(); else location.reload();
}

function injectCss(){
  if(document.getElementById('emb-css')) return;
  var st = document.createElement('style'); st.id = 'emb-css';
  st.textContent =
'.emb-bar{position:sticky;top:0;z-index:100;box-sizing:border-box;background:var(--bg2,#fff);border-top:4px solid var(--emb-a);border-bottom:1px solid var(--border,#dde1e9);padding:6px 20px;min-height:60px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 16px;font-family:"Sora",system-ui,sans-serif;color:var(--text,#1a1e2e)}'+
'.emb-brand{display:flex;align-items:center;gap:10px;min-width:0}'+
'.emb-mark{width:34px;height:34px;border-radius:8px;background:var(--emb-a);color:var(--emb-on);display:flex;align-items:center;justify-content:center;font:500 12px "DM Mono",monospace;flex:none}'+
'.emb-t{font-weight:700;font-size:14px;line-height:1.25}'+
'.emb-s{font-size:11px;color:var(--text2,#5a6175);line-height:1.3}'+
'.emb-nav{display:flex;gap:2px;flex-wrap:wrap}'+
'.emb-nav a{padding:8px 12px;border-radius:8px;font-size:13px;font-weight:600;color:var(--text2,#5a6175);text-decoration:none;white-space:nowrap}'+
'.emb-nav a:hover{background:var(--bg3,#f5f6f8);color:var(--text,#1a1e2e)}'+
'.emb-nav a.cur{background:var(--emb-soft);color:var(--emb-ink);font-weight:700}'+
'.emb-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}'+
'.emb-right #sync-status{font-size:11px;color:var(--text2,#5a6175);font-family:"DM Mono",monospace;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.emb-btn{min-height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--border2,#c8cdd8);background:var(--bg3,#f5f6f8);color:var(--text,#1a1e2e);font:600 12px "Sora",sans-serif;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none;white-space:nowrap}'+
'.emb-btn:hover{background:var(--border2,#c8cdd8)}'+
'.emb-user{font-size:12px;font-weight:600;color:var(--text2,#5a6175)}'+
'.emb-role{font-size:11px;font-weight:700;padding:5px 10px;border-radius:8px;background:var(--emb-a);color:var(--emb-on)}'+
'.emb-tools{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;padding:8px 20px;background:var(--bg2,#fff);border-bottom:1px solid var(--border,#dde1e9)}'+
'@media(max-width:900px){.emb-nav{order:3;width:100%;flex-wrap:nowrap;overflow-x:auto}.emb-user{display:none}.emb-bar{padding:6px 12px}}';
  document.head.appendChild(st);
}

function mount(){
  var host = document.getElementById('emelco-bar');
  if(!host) return;
  injectCss();
  var page = host.getAttribute('data-page') || '';
  var sub  = host.getAttribute('data-sub') || '';
  var s = getSession();
  var ops = !!(s && s.role === 'operations');

  host.className = 'emb-bar';
  host.setAttribute('role', 'banner');
  host.style.setProperty('--emb-a',    ops ? '#2563eb' : '#d4820a');
  host.style.setProperty('--emb-on',   ops ? '#ffffff' : '#000000');
  host.style.setProperty('--emb-soft', ops ? 'rgba(37,99,235,.12)' : 'rgba(212,130,10,.12)');
  host.style.setProperty('--emb-ink',  ops ? '#1d4ed8' : '#8a5200');

  var cur = null;
  for(var i = 0; i < MODS.length; i++){ if(MODS[i].k === page) cur = MODS[i]; }

  var nav = MODS.filter(function(m){ return !m.mgmtOnly || (s && s.role === 'owner'); }).map(function(m){
    var on = m.k === page;
    return '<a href="' + m.href + '"' + (on ? ' class="cur" aria-current="page"' : '') + '>' + esc(m.label) + '</a>';
  }).join('');

  var right = '<span id="sync-status"></span>' +
    '<button type="button" class="emb-btn" id="emb-sync" title="Pull the latest data">Sync</button>';
  if(s){
    right += '<span class="emb-user">' + esc(s.name) + '</span>' +
             '<span class="emb-role">' + roleLabel(s.role) + '</span>' +
             '<button type="button" class="emb-btn" id="emb-off">Log off</button>';
  }else{
    right += '<a class="emb-btn" href="dashboard.html?next=' + encodeURIComponent(currentFile()) + '">Sign in</a>';
  }

  host.innerHTML =
    '<div class="emb-brand"><div class="emb-mark">EM</div><div>' +
      '<div class="emb-t">EMELCO Logistics</div>' +
      '<div class="emb-s">' + esc(cur ? cur.label : '') + (sub ? ' · ' + esc(sub) : '') + '</div>' +
    '</div></div>' +
    '<nav class="emb-nav" aria-label="Modules">' + nav + '</nav>' +
    '<div class="emb-right">' + right + '</div>';

  var b1 = document.getElementById('emb-sync'); if(b1) b1.addEventListener('click', sync);
  var b2 = document.getElementById('emb-off');  if(b2) b2.addEventListener('click', logoff);

  /* Sticky elements below the bar use this to sit flush underneath it. */
  function setH(){ document.documentElement.style.setProperty('--emb-h', host.offsetHeight + 'px'); }
  setH();
  if(!window.__embResize){ window.__embResize = true; window.addEventListener('resize', setH); }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(setH);
}

window.EM = {
  PERSIST_MGMT: PERSIST_MGMT,
  MODS: MODS,
  getSession: getSession, setSession: setSession, clearSession: clearSession,
  roleLabel: roleLabel, guard: guard, logoff: logoff, safeNext: safeNext,
  mount: mount, onSync: null
};

mount();
})();
