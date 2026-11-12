/* conta.js — cadastro, login e ranking global, falando direto com a API do Supabase (sem biblioteca).
   Conta.on        o modo online está configurado?
   Conta.user      { id, name, email } ou null
   Conta.rpc(f, a) chama uma função do banco; rejeita com Error(mensagem em português)
   Conta.open()    abre a janela de entrar / criar conta (ou o menu da conta)
   Conta.submit(jogo, pontos)  envia a pontuação ao ranking se houver login
   Conta.onChange(fn)          avisa quando alguém entra ou sai */
(function(){
var C=window.FK_CONFIG||{},URL_=(C.url||'').replace(/\/$/,''),KEY=C.key||'',ON=!!(URL_&&KEY),K='fk-sessao',subs=[],ses=null;
try{ses=JSON.parse(localStorage.getItem(K)||'null')}catch(e){}
function save(s){ses=s;try{s?localStorage.setItem(K,JSON.stringify(s)):localStorage.removeItem(K)}catch(e){}paint();subs.forEach(function(f){try{f(user())}catch(e){}})}
function user(){return ses&&ses.user?{id:ses.user.id,email:ses.user.email,name:(ses.user.user_metadata||{}).username||'jogador'}:null}
var MSG=[[/invalid login credentials/i,'E-mail ou senha incorretos.'],[/already registered|already been registered/i,'Este e-mail já tem uma conta.'],[/not confirmed/i,'Confirme o seu e-mail (veja a caixa de entrada) antes de entrar.'],
 [/database error saving new user/i,'Esse nome de jogador já está em uso.'],[/password should be|weak password/i,'A senha precisa ter pelo menos 6 caracteres.'],[/rate limit|too many/i,'Muitas tentativas. Espere um pouco e tente de novo.'],
 [/valid email|invalid format/i,'Digite um e-mail válido.'],[/failed to fetch|networkerror|load failed/i,'Sem conexão com o servidor.'],[/jwt|token/i,'Sua sessão expirou. Entre de novo.']];
function human(m){m=String(m||'Algo deu errado.');for(var i=0;i<MSG.length;i++)if(MSG[i][0].test(m))return MSG[i][1];return m}
function call(path,body,token){return fetch(URL_+path,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+(token||KEY)},body:JSON.stringify(body||{})})
 .then(function(r){return r.text().then(function(t){var j=null;try{j=t?JSON.parse(t):null}catch(e){}if(!r.ok){var er=new Error(human(j&&(j.msg||j.error_description||j.message||j.error)||('Erro '+r.status)));er.status=r.status;throw er}return j})},
 function(e){throw new Error(human(e.message))})}
function setSes(j){if(j&&j.access_token){j.expires_at=Math.floor(Date.now()/1000)+(j.expires_in||3600);save(j);return true}return false}
var refreshing=null;
function fresh(){if(!ses)return Promise.resolve(null);if(ses.expires_at-60>Date.now()/1000)return Promise.resolve(ses.access_token);
 if(!refreshing)refreshing=call('/auth/v1/token?grant_type=refresh_token',{refresh_token:ses.refresh_token}).then(function(j){setSes(j);return ses.access_token},function(){save(null);return null}).then(function(t){refreshing=null;return t});
 return refreshing}
function rpc(fn,args){if(!ON)return Promise.reject(new Error('O modo online ainda não foi ativado.'));
 return fresh().then(function(t){return call('/rest/v1/rpc/'+fn,args,t).catch(function(e){if(e.status===401&&ses){ses.expires_at=0;return fresh().then(function(t2){if(!t2)throw e;return call('/rest/v1/rpc/'+fn,args,t2)})}throw e})})}
function login(email,pass){return call('/auth/v1/token?grant_type=password',{email:email,password:pass}).then(setSes)}
function signup(name,email,pass){
 if(!/^[A-Za-z0-9_]{3,16}$/.test(name))return Promise.reject(new Error('O nome de jogador deve ter de 3 a 16 letras, números ou _.'));
 if(pass.length<6)return Promise.reject(new Error('A senha precisa ter pelo menos 6 caracteres.'));
 return rpc('username_available',{p_username:name}).then(function(ok){if(!ok)throw new Error('Esse nome de jogador já está em uso.');
  return call('/auth/v1/signup',{email:email,password:pass,data:{username:name}})}).then(function(j){return setSes(j)?'in':'confirm'})}
function logout(){var t=ses&&ses.access_token;save(null);if(t)call('/auth/v1/logout',{},t).catch(function(){})}

/* ---------- interface ---------- */
var css='.fk-btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font:600 14px system-ui,sans-serif;color:#f2efe8;background:none;border:1px solid #2e2e33;border-radius:99px;padding:7px 13px;white-space:nowrap;text-decoration:none}.fk-btn:hover{border-color:#f5b733;color:#f5b733}'
+'.fk-ov{position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;animation:fkf .18s}'
+'.fk-box{width:min(100%,380px);background:#121214;border:1px solid #2e2e33;border-radius:8px;padding:22px;color:#f2efe8;font:15px/1.5 system-ui,sans-serif;animation:fku .25s cubic-bezier(.16,1,.3,1)}'
+'.fk-box h3{margin:0 0 4px;font:400 26px/1.1 "Iowan Old Style",Palatino,Georgia,serif}.fk-box p{margin:0 0 14px;color:#8b887f;font-size:14px}'
+'.fk-tabs{display:flex;gap:20px;border-bottom:1px solid #2e2e33;margin:0 0 16px}.fk-tabs button{background:none;border:0;border-bottom:2px solid transparent;border-radius:0;color:#8b887f;padding:8px 0;font:inherit;cursor:pointer;margin-bottom:-1px}.fk-tabs button.on{color:#f2efe8;border-color:#f5b733}'
+'.fk-box label{display:block;font:500 11px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8b887f;margin:12px 0 5px}'
+'.fk-box input{width:100%;box-sizing:border-box;background:#0c0c0d;border:1px solid #2e2e33;border-radius:4px;color:#f2efe8;font:inherit;padding:10px 12px;outline:0}.fk-box input:focus{border-color:#f5b733}'
+'.fk-go{width:100%;margin-top:18px;background:#f2efe8;color:#0c0c0d;border:0;border-radius:4px;padding:12px;font:600 15px system-ui,sans-serif;cursor:pointer}.fk-go:hover{background:#f5b733}.fk-go:disabled{opacity:.5;cursor:default}'
+'.fk-alt{width:100%;margin-top:10px;background:none;color:#f2efe8;border:1px solid #2e2e33;border-radius:4px;padding:11px;font:600 15px system-ui,sans-serif;cursor:pointer;display:block;text-align:center;text-decoration:none;box-sizing:border-box}.fk-alt:hover{border-color:#f5b733}'
+'.fk-err{min-height:20px;margin-top:10px;font-size:14px;color:#ff7a8f}.fk-err.ok{color:#6ee7b7}'
+'.fk-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:998;background:#121214;border:1px solid #f5b733;color:#f2efe8;border-radius:6px;padding:10px 16px;font:600 14px system-ui,sans-serif;display:flex;gap:8px;align-items:center;max-width:calc(100vw - 32px);animation:fku .3s cubic-bezier(.16,1,.3,1);cursor:pointer}'
+'@keyframes fkf{from{opacity:0}}@keyframes fku{from{opacity:0;transform:translate(var(--x,0),14px)}}.fk-toast{--x:-50%}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
var ic=function(n){return window.icon?window.icon(n):''},btn=null;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function paint(){if(!btn)return;var u=user();btn.innerHTML=ic('usuario')+'<span>'+(u?esc(u.name):'Entrar')+'</span>';btn.title=u?'Sua conta':'Entrar ou criar conta'}
function mount(){var h=document.querySelector('body>header'),nav=document.querySelector('.top nav');if(!h&&!nav)return;
 btn=document.createElement('button');btn.type='button';btn.className='fk-btn';btn.id='fk-conta';btn.onclick=function(){open()};
 if(h){btn.style.marginLeft='auto';var b=h.querySelector('.brand');if(b){b.style.marginLeft='0';h.insertBefore(btn,b)}else h.appendChild(btn)}else nav.appendChild(btn);paint()}
function close(){var o=document.querySelector('.fk-ov');if(o)o.remove()}
function open(then){close();var u=user(),ov=document.createElement('div');ov.className='fk-ov';ov.onclick=function(e){if(e.target===ov)close()};
 var box=document.createElement('div');box.className='fk-box';box.setAttribute('role','dialog');ov.appendChild(box);document.body.appendChild(ov);
 if(!ON){box.innerHTML='<h3>Modo online</h3><p>As contas, o ranking global e o xadrez contra outras pessoas ainda não foram ativados neste site.</p><button class="fk-alt" type="button">Fechar</button>';box.querySelector('button').onclick=close;return}
 if(u){box.innerHTML='<h3>'+esc(u.name)+'</h3><p>'+esc(u.email||'')+'</p><a class="fk-alt" href="ranking.html">Ver o ranking global</a><a class="fk-alt" href="xadrez.html?online=1">Xadrez online</a><button class="fk-go" type="button">Sair da conta</button>';
  box.querySelector('.fk-go').onclick=function(){logout();close()};return}
 var mode='in';
 function view(){box.innerHTML='<h3>'+(mode==='in'?'Entrar':'Criar conta')+'</h3><p>Com uma conta você entra no ranking global e joga xadrez contra outras pessoas.</p>'
  +'<div class="fk-tabs"><button type="button" data-m="in" class="'+(mode==='in'?'on':'')+'">Entrar</button><button type="button" data-m="up" class="'+(mode==='up'?'on':'')+'">Criar conta</button></div><form novalidate>'
  +(mode==='up'?'<label for="fk-n">Nome de jogador</label><input id="fk-n" autocomplete="username" maxlength="16" placeholder="3 a 16 letras, números ou _">':'')
  +'<label for="fk-e">E-mail</label><input id="fk-e" type="email" autocomplete="email"><label for="fk-p">Senha</label><input id="fk-p" type="password" autocomplete="'+(mode==='in'?'current-password':'new-password')+'">'
  +'<div class="fk-err" role="alert"></div><button class="fk-go">'+(mode==='in'?'Entrar':'Criar conta')+'</button></form>';
  box.querySelectorAll('[data-m]').forEach(function(b){b.onclick=function(){mode=b.dataset.m;view()}});
  var f=box.querySelector('form'),er=box.querySelector('.fk-err'),go=box.querySelector('.fk-go');box.querySelector('input').focus();
  f.onsubmit=function(e){e.preventDefault();er.className='fk-err';er.textContent='';var em=box.querySelector('#fk-e').value.trim(),pw=box.querySelector('#fk-p').value;
   if(!em||!pw){er.textContent='Preencha e-mail e senha.';return}go.disabled=true;
   (mode==='in'?login(em,pw).then(function(){return'in'}):signup(box.querySelector('#fk-n').value.trim(),em,pw)).then(function(r){
    if(r==='confirm'){er.className='fk-err ok';er.textContent='Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.';go.disabled=false;return}
    close();toast('Bem-vindo, '+user().name+'!');if(then)then()},function(x){er.textContent=x.message;go.disabled=false})}}
 view()}
function toast(html,ms,onclick){var o=document.querySelector('.fk-toast');if(o)o.remove();var t=document.createElement('div');t.className='fk-toast';t.innerHTML=html;t.onclick=function(){t.remove();if(onclick)onclick()};document.body.appendChild(t);setTimeout(function(){t.remove()},ms||4200)}
var hinted=false;
function submit(game,score){score=Math.floor(+score);if(!ON||!(score>0))return Promise.resolve(null);
 if(!user()){if(!hinted){hinted=true;toast(ic('trofeu')+'Entre para aparecer no ranking global',5000,function(){open()})}return Promise.resolve(null)}
 return rpc('submit_score',{p_game:game,p_score:score}).then(function(pos){toast(ic('trofeu')+'Ranking global: '+pos+'º lugar',4500,function(){location.href='ranking.html#'+game});return pos},function(){return null})}
addEventListener('keydown',function(e){if(e.key==='Escape')close()});
addEventListener('storage',function(e){if(e.key===K){try{ses=JSON.parse(e.newValue||'null')}catch(x){ses=null}paint()}});
window.Conta={on:ON,get user(){return user()},rpc:rpc,open:open,logout:logout,submit:submit,toast:toast,onChange:function(f){subs.push(f)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
