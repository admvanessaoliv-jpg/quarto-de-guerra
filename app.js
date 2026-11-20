{
/* ===== CONFIGURAÇÃO (passo 2: login real com Supabase + Kiwify) ===== */
const CONFIG={supabaseUrl:'https://qqihebtlwuijmbqszypn.supabase.co',supabaseAnonKey:'sb_publishable_CTmvlzF-xA-s_eNlKzIFPQ_RO-fXe2P',checkoutUrl:'https://pay.kiwify.com.br/jOSfIZm',checkoutAnual:'https://pay.kiwify.com.br/3tX1R5t',
/* e-mails que podem simular datas no perfil (Vanessa) */
admins:['contato.oracaoegratidao@gmail.com']};
const DEMO=!CONFIG.supabaseUrl;

const CAMPANHAS=QG.campanhas,LIVRE=QG.livre,CARTAS=QG.cartas;
/* ===== UTILIDADES ===== */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const diff=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const SEM=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const fLong=s=>{const d=parse(s);return SEM[d.getDay()]+', '+d.getDate()+' de '+MES[d.getMonth()]};
const fShort=s=>{const d=parse(s);return d.getDate()+' de '+MES[d.getMonth()]};
const uid=()=>Math.random().toString(36).slice(2,10);
const I={
hoje:'<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2.5-5 0 2 1 3 2 3 0-3-.5-5 .5-7z"/>',
mapa:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
campanha:'<path d="M5 21V4h12l-2 4 2 4H5"/>',
secreto:'<path d="M5 21V10a7 7 0 0 1 14 0v11z"/><path d="M15 15v1"/>',
cartas:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
trilhas:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
vitorias:'<path d="M12 3l2.8 5.9 6.2.7-4.6 4.3 1.2 6.1-5.6-3.1-5.6 3.1 1.2-6.1L3 9.6l6.2-.7z"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
back:'<path d="M15 5l-7 7 7 7"/>',chev:'<path d="M9 5l7 7-7 7"/>',check:'<path d="M5 12l5 5 9-10"/>',plus:'<path d="M12 5v14M5 12h14"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
circle:'<circle cx="12" cy="12" r="8"/>'};
const ic=(n,extra='')=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${I[n]}</svg>`;
const ARCH=`<svg class="arch" viewBox="0 0 150 190" aria-hidden="true" style="color:var(--rose)"><path d="M10 190V75a65 65 0 0 1 130 0v115" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M30 190V80a45 45 0 0 1 90 0v110" fill="none" stroke="currentColor" stroke-width="1"/><path d="M75 35v155M30 110h90" stroke="currentColor" stroke-width="1"/></svg>`;

/* ===== ESTADO ===== */
let session=DEMO?LS.get('qg_session',null):null,db=null,turno=null;
function today(){return ((DEMO||isAdmin())&&LS.get('qg_sim',''))||iso(new Date())}
function defaults(){const f=(n,p)=>({id:uid(),nome:n,promessa:p,pedidos:[]});return{frentes:[f('Casamento','Eclesiastes 4.12'),f('Filhos','Isaías 54.13'),f('Finanças','Filipenses 4.19'),f('Emoções','Salmo 34.18'),f('Casa e família','Josué 24.15')],turnos:{},feitos:{},lidas:[]}}
function load(){db=LS.get('qg_data_'+session.email,null)||defaults();db.aulas=db.aulas||{}}
function save(){checarSelos();LS.set('qg_data_'+session.email,db);if(sb&&session&&session.id){clearTimeout(syncT);syncT=setTimeout(()=>{sb.from('progresso').upsert({user_id:session.id,dados:db,atualizado:new Date().toISOString()}).then(r=>{if(r.error)console.warn(r.error)})},800)}}
const camp=()=>{const t=today();return CAMPANHAS.find(c=>t>=c.inicio&&diff(c.inicio,t)<c.dias.length)||null};
const prox=()=>CAMPANHAS.filter(c=>c.inicio>today()).sort((a,b)=>a.inicio<b.inicio?-1:1)[0]||null;
const diaDe=c=>Math.min(diff(c.inicio,today())+1,c.dias.length);
const nFeitos=c=>c.dias.filter((_,i)=>db.feitos[c.id+'-'+(i+1)]).length;
const livreHoje=()=>LIVRE[parse(today()).getDate()%LIVRE.length];
const conteudoHoje=()=>{const c=camp();return c?c.dias[diaDe(c)-1]:livreHoje()};
function streak(){let d=today(),n=0;if(!db.turnos[d])d=addDays(d,-1);while(db.turnos[d]){n++;d=addDays(d,-1)}return n}
const pedidos=()=>db.frentes.flatMap(f=>f.pedidos.map(p=>({...p,frente:f})));
const liberadas=()=>CARTAS.filter(c=>c.data<=today());
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2400)}
function sheet(h){$('#sheet').innerHTML=h;$('#overlay').classList.add('on');const f=$('#sheet input,#sheet textarea,#sheet select,#sheet button');if(f)f.focus()}
function close(){$('#overlay').classList.remove('on')}
const passosHTML=xs=>`<ol class="passos">${xs.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;

/* ===== LOGIN REAL (Supabase) ===== */
let sb=null,authState=DEMO?'ok':'carregando',bloqueio=null,needPass=/type=(invite|recovery|signup|magiclink)/.test(location.hash);
if(!DEMO&&window.supabase)sb=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey);
const isAdmin=()=>!!session&&CONFIG.admins.includes((session.email||'').toLowerCase());
let syncT=null;
function pedirNome(){setTimeout(()=>sheet(`<form id="fNome" class="stack"><h2>Que bom ter você aqui</h2><div><label for="nnome">Como podemos te chamar?</label><input id="nnome" required></div><button class="btn" type="submit">Continuar</button></form>`),250)}
async function abrirSessao(user){const email=(user.email||'').toLowerCase();
let ass=null;try{const r=await sb.from('assinantes').select('status').eq('email',email).maybeSingle();ass=r.data}catch(e){}
session={email,nome:'',id:user.id};
if(!ass||ass.status!=='ativa'){bloqueio=ass?ass.status:'sem';authState='ok';render();return}
bloqueio=null;let remoto=null;
try{const r=await sb.from('progresso').select('dados').eq('user_id',user.id).maybeSingle();remoto=r.data&&r.data.dados}catch(e){}
db=remoto||LS.get('qg_data_'+email,null)||defaults();db.aulas=db.aulas||{};session.nome=db.nome||'';
authState='ok';if(needPass){render();return}
if(/access_token|type=/.test(location.hash))history.replaceState(null,'',location.pathname+'#hoje');
render();if(!session.nome)pedirNome()}
async function init(){if(DEMO){render();return}
if(!sb){authState='erro';render();return}
sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY'){needPass=true;render()}});
try{const{data}=await sb.auth.getSession();if(data.session)await abrirSessao(data.session.user);else{authState='ok';render()}}catch(e){authState='ok';render()}}
function vCarregando(){return'<p class="muted" style="text-align:center;margin-top:40vh">Abrindo o seu quarto...</p>'}
function vErro(){return'<div class="login"><div class="brand"><h1>Quarto de <b>Guerra</b></h1><p class="muted">Não foi possível conectar agora. Verifique a sua internet e tente de novo.</p></div><button class="btn" onclick="location.reload()">Tentar de novo</button></div>'}
function vCriarSenha(){return`<div class="login"><div class="brand"><h1>Crie a sua <b>senha</b></h1><p class="muted">É com ela que você vai entrar no seu quarto de guerra. Use pelo menos 6 caracteres.</p></div>
<form id="fSenha" class="stack" novalidate><div><label for="ns1">Nova senha</label><input id="ns1" type="password" autocomplete="new-password" required></div><div><label for="ns2">Repita a senha</label><input id="ns2" type="password" autocomplete="new-password" required></div><p id="erroS" class="small" style="color:var(--rose)" role="alert"></p><button class="btn" type="submit">Salvar e entrar</button></form></div>`}
function vBloqueio(){const msg=bloqueio==='sem'?'Não encontramos uma assinatura ativa para <b>'+esc(session.email)+'</b>. Use o mesmo e-mail da sua compra na Kiwify.':bloqueio==='atrasada'?'O pagamento da sua assinatura está pendente. Assim que ele for confirmado, o seu acesso volta automaticamente.':'A sua assinatura não está ativa no momento. Renove para continuar as suas campanhas e trilhas.';
return`<div class="login"><div class="brand"><h1>Quarto de <b>Guerra</b></h1><p class="muted">${msg}</p></div><a class="btn" href="${esc(CONFIG.checkoutUrl)}">Assinar mensal · R$ 27</a><a class="btn soft" href="${esc(CONFIG.checkoutAnual)}">Assinar anual · R$ 197</a><button class="btn line" data-act="sair">Sair</button></div>`}

/* ===== TELAS ===== */
function vLogin(){return`<div class="login">
<svg class="pic" viewBox="0 0 260 230" role="img" aria-label="Janela em arco com luz suave"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--champ)"/><stop offset="1" stop-color="var(--rose-soft)"/></linearGradient><radialGradient id="l" cx=".5" cy=".35" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><g id="leaf"><ellipse cx="0" cy="0" rx="9" ry="4" fill="var(--rose)" opacity=".35"/></g></defs>
<path d="M60 225V105a70 70 0 0 1 140 0v120z" fill="url(#g)"/><circle cx="130" cy="95" r="60" fill="url(#l)"/>
<path d="M60 225V105a70 70 0 0 1 140 0v120" fill="none" stroke="var(--rose)" stroke-width="1.5"/><path d="M76 225V108a54 54 0 0 1 108 0v117" fill="none" stroke="var(--rose)" stroke-width=".8" opacity=".6"/><path d="M130 54v171M76 140h108" stroke="var(--rose)" stroke-width=".8" opacity=".6"/>
<path d="M30 225c10-40 20-70 40-95" fill="none" stroke="var(--rose)" stroke-width="1" opacity=".6"/><use href="#leaf" transform="translate(40 190) rotate(-60)"/><use href="#leaf" transform="translate(50 165) rotate(-30)"/><use href="#leaf" transform="translate(60 145) rotate(-70)"/>
<path d="M230 225c-10-40-20-70-40-95" fill="none" stroke="var(--rose)" stroke-width="1" opacity=".6"/><use href="#leaf" transform="translate(220 190) rotate(60)"/><use href="#leaf" transform="translate(210 165) rotate(30)"/><use href="#leaf" transform="translate(200 145) rotate(70)"/>
<path d="M20 225h220" stroke="var(--rose)" stroke-width="1" opacity=".5"/></svg>
<div class="brand"><h1>Quarto de <b>Guerra</b></h1><p class="muted">Fé, emoções e direção para cada dia, no seu lugar secreto de oração.</p><p class="verso">“Entre no seu quarto e, fechada a porta, ore a seu Pai.” <span class="small muted" style="font-family:inherit;font-style:normal">Mateus 6.6</span></p></div>
<form id="fLogin" class="stack" novalidate>
<div><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" placeholder="o e-mail da sua compra" required></div>
<div><label for="senha">Senha</label><input id="senha" type="password" autocomplete="current-password" placeholder="sua senha" required></div>
<p id="erro" class="small" style="color:var(--rose)" role="alert"></p>
<button class="btn" type="submit">Entrar no meu quarto</button>
<div class="row between"><button type="button" class="link" data-act="esqueci">Esqueci minha senha</button><button type="button" class="link" data-act="plano">Quero assinar</button></div>
</form>${DEMO?'<p class="demo">Modo demonstração: entre com qualquer e-mail e senha</p>':''}</div>`}

function saud(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'}
function vHoje(){const c=camp(),px=prox(),t=today(),rec=db.turnos[t],s=streak(),ct=conteudoHoje();
const dots=[...Array(7)].map((_,i)=>`<span class="${db.turnos[addDays(t,i-6)]?'on':''}"></span>`).join('');
const carta=liberadas().slice(-1)[0],prox1=CARTAS.find(x=>x.data>t);
const nome=session.nome?', '+esc(session.nome):'';
let campCard='';
if(c){const d=diaDe(c),f=nFeitos(c);campCard=`<a href="#campanha" class="hero" style="display:block;text-decoration:none;color:inherit">${ARCH}<div class="stack" style="gap:10px"><span class="eyebrow">Campanha de ${c.mes.toLowerCase()} · dia ${d} de ${c.dias.length}</span><h2 style="font-size:22px;line-height:1.2;max-width:240px">${esc(c.titulo)}</h2><div class="bar" style="max-width:230px"><i style="width:${f/c.dias.length*100}%"></i></div><span class="small muted">${f} de ${c.dias.length} dias concluídos</span></div></a>`}
else if(px)campCard=`<a href="#campanha" class="hero" style="display:block;text-decoration:none;color:inherit">${ARCH}<div class="stack" style="gap:8px"><span class="eyebrow">Próxima campanha · começa em ${fShort(px.inicio)}</span><h2 style="font-size:22px;line-height:1.2;max-width:240px">${esc(px.titulo)}</h2><span class="small muted" style="max-width:240px">Enquanto isso, o seu turno diário segue com direção para cada dia.</span></div></a>`;
const turnoCard=rec?`${rec.ancora?`<div class="block champ stack" style="gap:10px"><h3 style="margin:0">Sua âncora de hoje</h3>${ancoraHTML(rec.ancora)}</div>`:''}<div class="block rose stack" style="gap:12px"><h3>Desafio de hoje</h3><p style="font-weight:500">${esc(rec.desafio)}</p>${rec.cumprido?`<span class="check" style="color:var(--sage)">${ic('check')} Desafio cumprido</span>`:`<button class="btn" data-act="cumpri">${ic('check')} Cumpri o desafio</button>`}<div class="row between" style="flex-wrap:wrap"><button class="link" data-act="turno">Refazer o turno de hoje</button><button class="link" data-go="secreto">Ver meu registro</button></div></div>`
:`<div class="card stack"><div class="row between"><span class="eyebrow">${c?'Dia '+diaDe(c)+' · ':''}Direcionamento de hoje</span><span class="small muted">cerca de 20 min</span></div>
<h2 style="font-size:21px;line-height:1.25">${esc(ct.t)}</h2><p class="read" style="font-size:16px">${esc(ct.d)}</p>
<div class="stack" style="gap:8px">${ORDEM.map(k=>ETAPAS[k]).map((x,i)=>`<div class="row"><span class="num">${i+1}</span><span>${x}</span></div>`).join('')}</div>
<button class="btn" data-act="turno">Começar meu turno</button></div>`;
return`<div class="stack" style="gap:18px">
<div class="row between"><div><p class="small muted">${fLong(t)}</p><h1>${saud()}${nome}</h1></div><button class="avatar" data-act="perfil" aria-label="Meu perfil">${esc((session.nome||session.email)[0].toUpperCase())}</button></div>
<div class="card row between" style="padding:14px 16px"><div><p style="font-weight:600">${s} ${s===1?'dia':'dias'} de constância</p><p class="small muted">no seu quarto de guerra</p></div><div class="dots" aria-label="Últimos 7 dias">${dots}</div></div>
${db.diag?'':`<button class="item" data-go="diagnostico" style="background:var(--rose-soft);border-color:transparent"><span><span class="eyebrow">Comece por aqui</span><b>Faça o diagnóstico do coração</b><span class="muted">Descubra quais muros precisam de cuidado e por onde começar</span></span>${ic('chev')}</button>`}
${turnoCard}
${campCard}
<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><button class="card stack" data-act="oracao" style="gap:6px;text-align:left;cursor:pointer;font:inherit;color:inherit"><span class="eyebrow">Pedido de oração</span><b style="font-weight:600">A Vanessa ora por você</b><span class="small muted">Envie o seu pedido</span></button><button class="card stack" data-go="devocional" style="gap:6px;text-align:left;cursor:pointer;font:inherit;color:inherit"><span class="eyebrow">Palavra do dia</span><b style="font-weight:600">${esc(QG.devocional[devIdx()][1])}</b><span class="small muted">${esc(QG.devocional[devIdx()][0])}</span></button></div>
${(()=>{const pa=proxAula();return pa?`<button class="item" data-go="aula-${pa.tr.id}-${pa.n}"><span><span class="eyebrow">Continue sua trilha · ${esc(pa.tr.titulo)}</span><b>Aula ${pa.n}: ${esc(pa.tr.itens[pa.n-1].t)}</b><span class="muted">${esc(pa.tr.itens[pa.n-1].resumo)}</span></span>${ic('chev')}</button>`:''})()}
<button class="item" data-go="conquistas"><span><span class="eyebrow">Minhas conquistas</span><b>${selos().filter(x=>x.ok).length} de ${selos().length} selos</b><span class="muted">Veja o que você já conquistou</span></span>${ic('vitorias')}</button>
${carta?`<button class="item" data-act="carta" data-i="${CARTAS.indexOf(carta)}"><span><span class="eyebrow">Carta da semana</span><b>${esc(carta.titulo)}</b><span class="muted">${db.lidas.includes(carta.data)?'Lida':'Nova · 3 min de leitura'}</span></span>${ic('chev')}</button>`:prox1?`<div class="item" style="cursor:default"><span><span class="eyebrow">Carta da semana</span><b>A primeira carta chega em ${fShort(prox1.data)}</b><span class="muted">Toda segunda-feira, uma palavra escrita para a sua semana</span></span>${ic('cartas')}</div>`:''}
</div>`}

const ETAPAS={palavra:'A Palavra',alma:'Olhar da alma',exercicio:'Exercício terapêutico',oracao:'Oração estratégica',ancora:'Âncora e desafio',registro:'Registro no secreto'};
const ORDEM=['palavra','alma','exercicio','oracao','ancora','registro'];
function ancoraHTML(a){return`<div class="stack" style="gap:10px"><div class="row" style="align-items:flex-start"><span class="num">1</span><span><b style="font-weight:600">Quando usar:</b> ${esc(a.q)}</span></div><div class="row" style="align-items:flex-start"><span class="num">2</span><span><b style="font-weight:600">Gesto:</b> ${esc(a.s)}</span></div><div class="row" style="align-items:flex-start"><span class="num">3</span><span><b style="font-weight:600">Frase:</b> <span class="verso" style="font-size:19px">${esc(a.f)}</span></span></div></div>`}
function vTurno(){const t=turno,ct=t.ct,st=t.step,k=ORDEM[st];
const fr=db.frentes.find(f=>f.id===t.frente)||db.frentes[0];
const abertos=fr?fr.pedidos.filter(p=>!p.resp):[];
let body='';
if(k==='palavra')body=`<h1>${esc(ct.t)}</h1><p class="verso">${esc(ct.r)}</p><p class="read">${esc(ct.p)}</p><p class="small muted">Leia a passagem completa na sua Bíblia (NAA ou NVT).</p>
<div class="block rose"><h3>Direcionamento do dia</h3><p class="read" style="font-size:16px">${esc(ct.d)}</p></div>`;
if(k==='alma')body=`<h1>O que acontece na sua alma</h1><div class="block champ"><h3>Olhar para a alma</h3><p class="read" style="font-size:16px">${esc(ct.e)}</p></div>
${ct.n?`<div class="block"><h3>O que acontece no seu cérebro</h3><p class="read" style="font-size:16px">${esc(ct.n)}</p></div>`:''}
<p class="small muted">A Palavra cura, e Deus também nos deu entendimento sobre como a mente funciona. Uma coisa não anula a outra.</p>`;
if(k==='exercicio')body=`<h1>${esc(ct.x)}</h1><div class="card stack" style="gap:12px"><h3 style="font-size:14px;font-weight:700;margin:0;color:var(--rose)">Faça com calma, passo a passo</h3>${passosHTML(ct.xs)}<button class="btn soft small" data-act="respirar" style="align-self:flex-start">Respirar comigo antes · 1 min</button></div>
<div><label for="ex">Minhas respostas do exercício</label><textarea id="ex" style="min-height:180px" placeholder="Escreva aqui tudo o que o exercício pede">${esc(t.ex)}</textarea></div>`;
if(k==='oracao')body=`<h1>Ore com direção</h1><div class="card"><p class="verso" style="font-size:20px">${esc(ct.o)}</p></div>
<div><label for="frente">Continue orando pela frente</label><select id="frente">${db.frentes.map(f=>`<option value="${f.id}" ${f.id===fr?.id?'selected':''}>${esc(f.nome)}</option>`).join('')}</select></div>
${fr&&fr.promessa?`<p class="small muted">Promessa ancorada: ${esc(fr.promessa)}</p>`:''}
${abertos.length?`<div class="stack" style="gap:8px">${abertos.map(p=>`<div class="row" style="align-items:flex-start"><span class="num">${ic('circle','style="width:12px;height:12px"')}</span><span>${esc(p.texto)}</span></div>`).join('')}</div>`:`<p class="small muted">Esta frente ainda não tem pedidos. Você pode adicioná-los no Mapa de Batalha.</p>`}`;
if(k==='ancora')body=`<h1>Para levar para o seu dia</h1>${ct.a?`<div class="block rose stack" style="gap:12px"><h3 style="margin:0">Âncora do dia</h3><p class="small" style="margin-top:-4px">Repita a âncora sempre que precisar. Com a repetição, o gesto e a frase passam a trazer de volta a paz que você encontrou aqui.</p>${ancoraHTML(ct.a)}</div>`:''}
<div class="block champ"><h3>Desafio de hoje</h3><p class="read" style="font-weight:500">${esc(ct.c)}</p></div><p class="small muted">A fé que nasce no secreto se mostra na vida real. Quando cumprir o desafio, marque na tela Hoje.</p>`;
if(k==='registro')body=`<h1>Meu registro no secreto</h1><p class="muted">Só você vê o que escreve aqui. Escreva com sinceridade, sem se preocupar com as palavras certas.</p>
${ct.g.map((q,i)=>`<div><label for="reg${i}">${esc(q)}</label><textarea id="reg${i}">${esc(t.reg[i]||'')}</textarea></div>`).join('')}`;
const last=ORDEM.length-1;
return`<div class="stack" style="gap:20px"><div class="row between"><button class="link" data-act="sairTurno">${ic('back')} Sair</button><span class="small muted">${t.camp?esc(t.camp.titulo)+' · dia '+t.dia:'Turno do dia'}</span></div>
<div class="steps">${ORDEM.map((_,i)=>`<i class="${i<=st?'on':''}"></i>`).join('')}</div>
<span class="eyebrow">${st+1} de ${ORDEM.length} · ${ETAPAS[k]}</span>
<div class="stack" style="gap:16px">${body}</div>
<div class="row" style="margin-top:8px">${st>0?'<button class="btn line" data-act="passoAnt" style="flex:1">Voltar</button>':''}<button class="btn" data-act="${st<last?'passoProx':'concluir'}" style="flex:2">${st===last?'Concluir meu turno':k==='ancora'?'Aceito o desafio':'Continuar'}</button></div></div>`}

function vMapa(){return`<div class="stack"><div class="stack" style="gap:6px"><h1>Mapa de Batalha</h1><p class="muted">Cada frente da sua vida com seus pedidos e uma promessa da Palavra.</p></div>
${db.frentes.map(f=>{const ab=f.pedidos.filter(p=>!p.resp).length;return`<button class="item" data-act="frente" data-id="${f.id}"><span><b>${esc(f.nome)}</b><span class="muted">${ab} ${ab===1?'pedido':'pedidos'}${f.promessa?' · '+esc(f.promessa):''}</span></span>${ic('chev')}</button>`}).join('')}
<button class="btn line" data-act="novaFrente">${ic('plus')} Abrir nova frente</button>
<button class="item" data-go="vitorias"><span><span class="eyebrow">Mural de Vitórias</span><b>${pedidos().filter(p=>p.resp).length} respostas registradas</b><span class="muted">Lembre do que Deus já fez</span></span>${ic('vitorias')}</button></div>`}

function sheetFrente(id){const f=db.frentes.find(x=>x.id===id);if(!f)return;
const ab=f.pedidos.filter(p=>!p.resp),re=f.pedidos.filter(p=>p.resp);
sheet(`<div class="stack"><div class="row between"><h2 style="font-size:22px">${esc(f.nome)}</h2><button class="link" data-act="fechar">Fechar</button></div>
<div><label for="prom">Promessa ancorada</label><input id="prom" value="${esc(f.promessa)}" placeholder="Ex.: Isaías 54.13" data-id="${f.id}"></div>
<h2 style="font-size:16px">Pedidos em oração</h2>
${ab.length?ab.map(p=>`<div class="card" style="padding:14px"><p>${esc(p.texto)}</p><p class="small muted">orando há ${Math.max(diff(p.criado,today()),0)} dias</p><div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn small" data-act="responder" data-f="${f.id}" data-p="${p.id}">${ic('check')} Foi respondido</button><button class="link" data-act="apagarPedido" data-f="${f.id}" data-p="${p.id}" aria-label="Apagar pedido">${ic('trash')}</button></div></div>`).join(''):'<p class="small muted">Nenhum pedido nesta frente ainda.</p>'}
<form id="fPedido" class="row" data-id="${f.id}"><input id="novoPedido" placeholder="Novo pedido" aria-label="Novo pedido"><button class="btn small" type="submit" aria-label="Adicionar pedido">${ic('plus')}</button></form>
${re.length?`<p class="small muted">${re.length} ${re.length===1?'resposta registrada':'respostas registradas'} no Mural de Vitórias</p>`:''}
<button class="link" data-act="apagarFrente" data-id="${f.id}" style="align-self:flex-start">Apagar esta frente</button></div>`)}

function cartasHTML(cid){const t=today();return CARTAS.filter(c=>!cid||c.camp===cid).map((c,i)=>c.data<=t?`<button class="item" data-act="carta" data-i="${i}"><span><span class="eyebrow">${fShort(c.data)}</span><b>${esc(c.titulo)}</b><span class="muted">${esc(c.ref)}</span></span>${db.lidas.includes(c.data)?'<span class="chip ok">Lida</span>':'<span class="chip">Nova</span>'}</button>`:`<div class="item" style="cursor:default;opacity:.75"><span><span class="eyebrow">Libera em ${fShort(c.data)}</span><b>Carta da semana</b><span class="muted">Disponível na segunda-feira</span></span>${ic('lock')}</div>`).join('')}

function vCampanha(){const c=camp()||prox()||CAMPANHAS[CAMPANHAS.length-1],t=today();
const ativa=t>=c.inicio&&diff(c.inicio,t)<c.dias.length,hoje=ativa?diaDe(c):0;
return`<div class="stack" style="gap:18px"><div class="stack" style="gap:6px"><h1>Campanha do mês</h1><p class="muted">Todo mês, 21 dias de direção para a fé e para as emoções.</p></div>
<div class="hero">${ARCH}<div class="stack" style="gap:8px"><span class="eyebrow">${ativa?'Em andamento':'Começa em '+fShort(c.inicio)} · ${c.mes}</span><h2 style="font-size:22px;line-height:1.2;max-width:240px">${esc(c.titulo)}</h2><p class="small" style="max-width:250px">${esc(c.resumo)}</p>${ativa?`<div class="bar" style="max-width:230px"><i style="width:${nFeitos(c)/c.dias.length*100}%"></i></div>`:''}</div></div>
<div class="stack" style="gap:10px"><h2 style="font-size:16px">Os 21 dias</h2><div class="days">${c.dias.map((d,i)=>{const n=i+1,ok=db.feitos[c.id+'-'+n],lib=ativa&&n<=hoje;return`<button class="day ${ok?'done':''} ${n===hoje?'today':''}" data-act="dia" data-n="${n}" ${lib?'':'disabled'} aria-label="Dia ${n}: ${esc(d.t)}${ok?', concluído':lib?'':', bloqueado'}">${n}</button>`}).join('')}</div>
<p class="small muted">${ativa?'Um dia novo libera a cada manhã. Toque num dia liberado para fazer ou rever o turno.':'Os dias começam a liberar em '+fShort(c.inicio)+', um por dia.'}</p></div>
<button class="item" data-go="planner"><span><b>Planner do mês para imprimir</b><span class="muted">Os 21 dias da campanha em uma folha</span></span>${ic('chev')}</button>
<div class="stack" style="gap:10px"><h2 style="font-size:16px">Cartas da semana</h2><p class="small muted">Toda segunda-feira, uma palavra escrita da Vanessa.</p>${cartasHTML(c.id)}</div></div>`}

function vCarta(i){const c=CARTAS[i];if(!c||c.data>today())return vCampanha();
if(!db.lidas.includes(c.data)){db.lidas.push(c.data);save()}
return`<div class="stack carta" style="gap:16px"><button class="link" data-go="campanha" style="align-self:flex-start">${ic('back')} Campanha</button><span class="eyebrow">${fShort(c.data)} · ${esc(c.ref)}</span><h1>${esc(c.titulo)}</h1>
<div><p>Querida,</p>${c.p.map(x=>`<p>${esc(x)}</p>`).join('')}</div>
<div class="card stack" style="gap:10px"><h2 style="font-size:16px">Para levar ao seu quarto de guerra esta semana</h2>${c.passos.map((x,j)=>`<div class="row" style="align-items:flex-start"><span class="num">${j+1}</span><span>${esc(x)}</span></div>`).join('')}</div>
<p>Com amor,<br><span class="verso" style="font-size:24px">Vanessa</span></p></div>`}

function vSecreto(){const its=Object.entries(db.turnos).sort((a,b)=>a[0]<b[0]?1:-1);const aulas=Object.values(db.aulas||{}).filter(x=>x.feito).sort((a,b)=>a.data<b.data?1:-1);
return`<div class="stack"><div class="stack" style="gap:6px"><h1>Meu registro no secreto</h1><p class="muted">Tudo o que Deus falou com você, dia após dia. Só você vê.</p></div>
${its.length?its.map(([d,r])=>`<details class="card"><summary><span><span class="eyebrow">${fShort(d)}${r.dia?' · dia '+r.dia:''}</span><b style="display:block;font-weight:600">${esc(r.titulo||'Turno do dia')}</b></span>${ic('chev')}</summary><div class="stack" style="gap:12px;margin-top:12px">
${r.ex?`<div><p class="small muted">Exercício</p><p style="white-space:pre-line">${esc(r.ex)}</p></div>`:''}
${(r.perg||[]).map((q,i)=>r.reg&&r.reg[i]?`<div><p class="small muted">${esc(q)}</p><p style="white-space:pre-line">${esc(r.reg[i])}</p></div>`:'').join('')}
${r.ancora?`<div><p class="small muted">Âncora</p><p class="verso" style="font-size:19px">${esc(r.ancora.f)}</p></div>`:''}<div><p class="small muted">Desafio</p><p>${esc(r.desafio||'')} ${r.cumprido?'<span class="chip ok">Cumprido</span>':''}</p></div></div></details>`).join('')
:`<div class="card"><p class="muted">Seu registro ainda está em branco. Ele começa no seu primeiro turno de vigia.</p></div><button class="btn" data-go="hoje">Fazer o turno de hoje</button>`}
${aulas.length?`<h2 style="margin-top:8px">Das minhas trilhas</h2>${aulas.map(x=>`<details class="card"><summary><span><span class="eyebrow">${fShort(x.data)} · ${esc(x.trilha)}</span><b style="display:block;font-weight:600">${esc(x.titulo)}</b></span>${ic('chev')}</summary><div class="stack" style="gap:12px;margin-top:12px">${x.notas?`<div><p class="small muted">Anotações da prática</p><p style="white-space:pre-line">${esc(x.notas)}</p></div>`:''}${(x.perg||[]).map((q,i)=>x.resp&&x.resp[i]?`<div><p class="small muted">${esc(q)}</p><p style="white-space:pre-line">${esc(x.resp[i])}</p></div>`:'').join('')}</div></details>`).join('')}`:''}</div>`}

function vVitorias(){const ps=pedidos(),re=ps.filter(p=>p.resp).sort((a,b)=>a.resp.data<b.resp.data?1:-1),ab=ps.filter(p=>!p.resp).length;
return`<div class="stack"><button class="link" data-go="mapa" style="align-self:flex-start">${ic('back')} Mapa de Batalha</button><div class="stack" style="gap:6px"><h1>Mural de Vitórias</h1><p class="muted">Registre cada resposta. No tempo de espera, lembre do que Deus já fez.</p></div>
<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><div class="card"><p style="font-size:34px;font-weight:300;color:var(--rose);line-height:1">${re.length}</p><p class="small muted">${re.length===1?'resposta registrada':'respostas registradas'}</p></div><div class="card"><p style="font-size:34px;font-weight:300;color:var(--rose);line-height:1">${ab}</p><p class="small muted">${ab===1?'pedido em espera':'pedidos em espera'}</p></div></div>
${re.length?re.map(p=>`<div class="card stack" style="gap:6px"><p style="font-weight:500">${esc(p.resp.nota||p.texto)}</p>${p.resp.nota?`<p class="small muted">Pedido: ${esc(p.texto)}</p>`:''}<p class="small muted">${esc(p.frente.nome)} · ${fShort(p.resp.data)} · orado por ${Math.max(diff(p.criado,p.resp.data),1)} dias</p></div>`).join(''):`<div class="card"><p class="muted">Seu mural ainda está em branco. Quando um pedido for respondido, marque-o no Mapa de Batalha ou registre aqui.</p></div>`}
<button class="btn" data-act="novaVitoria">${ic('plus')} Registrar uma resposta</button></div>`}

function vPerfil(){return`<div class="stack" style="gap:18px"><button class="link" data-go="hoje" style="align-self:flex-start">${ic('back')} Voltar</button><h1>Meu perfil</h1>
<form id="fPerfil" class="card stack"><div><label for="pnome">Como podemos te chamar?</label><input id="pnome" value="${esc(session.nome)}"></div><p class="small muted">${esc(session.email)}</p><button class="btn small" type="submit" style="align-self:flex-start">Salvar</button></form>
<div class="card row between"><div><p style="font-weight:600">Assinatura</p><p class="small muted">${DEMO?'Ativa (demonstração)':'Ativa'}</p></div><span class="chip ok">Ativa</span></div>
${DEMO||isAdmin()?`<div class="card stack"><div><label for="sim">Ver o app como se fosse o dia</label><input id="sim" type="date" value="${today()}"></div><p class="small muted">Só você vê esta opção. Serve para conferir a campanha e as cartas liberando antes das assinantes.</p><div class="row" style="flex-wrap:wrap"><button class="link" data-act="simHoje">Voltar para hoje</button><button class="link" data-act="zerar">Recomeçar do zero</button></div></div>`:''}
<div class="card stack"><h2 style="font-size:16px">Lembrete diário</h2><p class="small muted">Escolha o horário do seu turno e adicione um lembrete que se repete todos os dias no calendário do celular.</p><div><label for="hlemb">Horário</label><input id="hlemb" type="time" value="${esc((db&&db.lembrete)||'06:30')}"></div><button class="btn soft small" data-act="lembreteIcs" style="align-self:flex-start">Adicionar ao calendário (iPhone e outros)</button><button class="btn soft small" data-act="lembreteGoogle" style="align-self:flex-start">Adicionar ao Google Agenda</button></div>
<button class="item" data-go="conquistas"><span><b>Minhas conquistas</b><span class="muted">Selos da sua caminhada</span></span>${ic('chev')}</button>
<button class="item" data-go="diagnostico"><span><b>Diagnóstico do coração</b><span class="muted">${db&&db.diag?'Ver ou refazer':'Fazer agora'}</span></span>${ic('chev')}</button>
${isAdmin()?`<button class="item" data-act="verPedidos" style="background:var(--rose-soft);border-color:transparent"><span><span class="eyebrow">Só você vê</span><b>Pedidos de oração das assinantes</b></span>${ic('chev')}</button>`:''}
<p class="small muted">Os exercícios emocionais do app ajudam no autocuidado e não substituem acompanhamento terapêutico.</p>
<button class="btn line" data-act="sair">Sair</button></div>`}

/* ===== TRILHAS (Escola de Oração, Formação, Parábolas, Jejum, Quiz) ===== */
const ORDEM_TRILHAS=[['escola','Escola de Oração'],['formacao','Formação da Mulher Cristã'],['parabolas','Parábolas de Jesus e a vida emocional'],['jejum','Jornada de Jejum'],['quiz','Quiz bíblico']];
const aulaKey=(id,n)=>id+'-'+n;
const feitasDe=tr=>tr.itens.filter((_,i)=>db.aulas[aulaKey(tr.id,i+1)]?.feito).length;
function proxAula(){for(const[id]of ORDEM_TRILHAS){const tr=QG.trilhas[id];if(!tr||!tr.itens)continue;const i=tr.itens.findIndex((_,k)=>!db.aulas[aulaKey(id,k+1)]?.feito);if(i>=0)return{tr,n:i+1}}return null}
function vTrilhas(){const md=QG.midia,nm=md?md.itens.length:0;return`<div class="stack"><div class="stack" style="gap:6px"><h1>Trilhas</h1><p class="muted">Formação para a sua vida de oração, as suas emoções e a sua identidade.</p></div>
${md?`<button class="hero" data-go="midia" style="text-align:left;cursor:pointer;color:inherit;font:inherit;width:100%">${ARCH}<div class="stack" style="gap:8px"><span class="eyebrow">${nm?nm+(nm===1?' conteúdo':' conteúdos'):'Em breve'}</span><h2 style="font-size:22px;max-width:240px">${esc(md.titulo)}</h2><p class="small" style="max-width:250px">${esc(md.sub)}</p></div></button>`:''}
${ORDEM_TRILHAS.map(([id,nome])=>{if(id==='jejum'&&QG.jejum){const J=db.jejum||{planos:{}},n=QG.jejum.planos.filter(p=>(J.planos[p.id]||{feitos:[]}).feitos.length>=p.dias.length).length;return`<button class="item" data-go="jejum"><span><b>${esc(QG.jejum.titulo)}</b><span class="muted">${esc(QG.jejum.sub)}</span><span class="small muted">${n} de ${QG.jejum.planos.length} propostas concluídas</span></span>${ic('chev')}</button>`}
if(id==='quiz'&&QG.quiz)return`<button class="item" data-go="quiz"><span><b>Quiz bíblico</b><span class="muted">${QG.quiz.length} perguntas para aprofundar o conhecimento da Palavra</span><span class="small muted">Melhor resultado: ${(db.quiz||{}).melhor||0} de 10</span></span>${ic('chev')}</button>`;
const tr=QG.trilhas[id];if(!tr)return`<div class="item" style="cursor:default;opacity:.7"><span><b>${esc(nome)}</b><span class="muted">Em breve</span></span>${ic('lock')}</div>`;
const tot=tr.itens.length,f=feitasDe(tr);return`<button class="item" data-go="trilha-${id}"><span style="flex:1"><b>${esc(tr.titulo)}</b><span class="muted">${esc(tr.sub)}</span><span class="bar" style="display:block;margin-top:8px"><i style="width:${f/tot*100}%"></i></span><span class="small muted">${f} de ${tot} concluídas</span></span>${ic('chev')}</button>`}).join('')}</div>`}
function ytId(x){const m=String(x||'').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);return m?m[1]:x}
function vMidia(){const md=QG.midia;if(!md)return vTrilhas();const c=camp();
const its=md.itens.slice().sort((a,b)=>(c&&b.campanha===c.id)-(c&&a.campanha===c.id));
return`<div class="stack" style="gap:16px"><button class="link" data-go="trilhas" style="align-self:flex-start">${ic('back')} Trilhas</button><h1>${esc(md.titulo)}</h1><p class="muted">${esc(md.sub)}</p>
<div class="hero">${ARCH}<div class="stack" style="gap:8px"><span class="eyebrow">Em breve</span><h2 style="font-size:21px;max-width:240px">Noite no Quarto de Guerra</h2><p class="small" style="max-width:250px">Um encontro ao vivo por mês com a Vanessa, para abrir a campanha e orar pelos pedidos das assinantes.</p></div></div>
${its.length?its.map(m=>`<div class="card stack" style="gap:10px">${c&&m.campanha===c.id?'<span class="chip" style="align-self:flex-start">Campanha do mês</span>':''}<h2 style="font-size:17px">${esc(m.t)}</h2>${m.desc?`<p class="small muted">${esc(m.desc)}</p>`:''}
${m.tipo==='video'?`<div style="position:relative;padding-top:56.25%;border-radius:16px;overflow:hidden;background:var(--champ)"><iframe src="https://www.youtube-nocookie.com/embed/${esc(ytId(m.youtube||m.url))}" title="${esc(m.t)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><a class="small" href="https://youtu.be/${esc(ytId(m.youtube||m.url))}" target="_blank" rel="noopener" style="align-self:flex-start">Abrir no YouTube</a>`:`<audio controls preload="none" src="${esc(m.url)}" style="width:100%"></audio>`}</div>`).join('')
:`<div class="block rose stack" style="gap:10px"><h3 style="margin:0">Em breve</h3><p class="read" style="font-size:16px">Aqui você vai encontrar orações em áudio, vídeos e aulas gravadas pela Vanessa para caminhar com você em cada campanha.</p></div>`}</div>`}
function vTrilha(id){const tr=QG.trilhas[id];if(!tr)return vTrilhas();
return`<div class="stack"><button class="link" data-go="trilhas" style="align-self:flex-start">${ic('back')} Trilhas</button><div class="hero">${ARCH}<div class="stack" style="gap:8px"><span class="eyebrow">${feitasDe(tr)} de ${tr.itens.length} concluídas</span><h1 style="font-size:26px;max-width:260px">${esc(tr.titulo)}</h1><p class="small" style="max-width:250px">${esc(tr.sub)}</p></div></div>
${tr.itens.map((a,i)=>{const ok=db.aulas[aulaKey(id,i+1)]?.feito;return`<button class="item" data-go="aula-${id}-${i+1}"><span class="row" style="align-items:flex-start"><span class="num" style="${ok?'background:var(--rose);color:var(--rose-ink)':''}">${ok?ic('check','style="width:16px;height:16px"'):i+1}</span><span><b>${esc(a.t)}</b><span class="muted">${esc(a.r)}</span></span></span>${ic('chev')}</button>`}).join('')}</div>`}
function vAula(id,n){const tr=QG.trilhas[id],a=tr&&tr.itens[n-1];if(!a)return vTrilhas();const sv=db.aulas[aulaKey(id,n)]||{};
return`<div class="stack" style="gap:18px"><button class="link" data-go="trilha-${id}" style="align-self:flex-start">${ic('back')} ${esc(tr.titulo)}</button>
<span class="eyebrow">Aula ${n} de ${tr.itens.length}</span><h1>${esc(a.t)}</h1><p class="verso">${esc(a.r)}</p><p class="muted">${esc(a.resumo)}</p>
<div class="stack" style="gap:14px">${a.ensino.map(p=>`<p class="read">${esc(p)}</p>`).join('')}</div>
<div class="block champ"><h3>Olhar para a alma</h3><p class="read" style="font-size:16px">${esc(a.alma)}</p></div>
<div class="block"><h3>O que acontece no seu cérebro</h3><p class="read" style="font-size:16px">${esc(a.cerebro)}</p></div>
<div class="card stack" style="gap:12px"><h3 style="font-size:14px;font-weight:700;margin:0;color:var(--rose)">Prática</h3>${passosHTML(a.pratica)}<div><label for="anotacoes">Minhas anotações da prática</label><textarea id="anotacoes" style="min-height:160px">${esc(sv.notas||'')}</textarea></div></div>
${a.aviso?`<div class="block" style="border-color:var(--rose)"><h3>Importante</h3><p class="read" style="font-size:16px">${esc(a.aviso)}</p></div>`:''}
<div class="block rose"><h3>Tarefa da semana</h3><p class="read" style="font-weight:500;font-size:16px">${esc(a.tarefa)}</p></div>
<div class="stack" style="gap:12px"><h2>Meu registro no secreto</h2>${a.perguntas.map((q,i)=>`<div><label for="aq${i}">${esc(q)}</label><textarea id="aq${i}">${esc((sv.resp||[])[i]||'')}</textarea></div>`).join('')}</div>
<button class="btn" data-act="concluirAula" data-id="${id}" data-n="${n}">${sv.feito?'Salvar alterações':'Concluir aula'}</button></div>`}

/* ===== JORNADA DE JEJUM ===== */
function jj(){db.jejum=db.jejum||{termo:false,planos:{}};return db.jejum}
function vJejum(){const J=QG.jejum,st=jj();
return`<div class="stack" style="gap:16px"><button class="link" data-go="trilhas" style="align-self:flex-start">${ic('back')} Trilhas</button><h1>${esc(J.titulo)}</h1><p class="muted">${esc(J.sub)}</p>
<div class="stack" style="gap:10px"><h2>O que a Bíblia ensina</h2>${J.ensino.map(s=>`<details class="card"><summary><b style="font-weight:600">${esc(s.h)}</b>${ic('chev')}</summary><div class="stack" style="gap:10px;margin-top:10px">${s.p.map(x=>`<p class="read" style="font-size:16px">${esc(x)}</p>`).join('')}</div></details>`).join('')}</div>
<div class="block" style="border-color:var(--rose)"><h3>Cuide da sua saúde</h3><p class="read" style="font-size:16px">Não faça jejum de alimentos sem autorização médica se você:</p><ul style="margin:8px 0 12px;padding-left:20px">${J.naoFaca.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="read" style="font-size:16px">Nesses casos, escolha o <b>jejum de mídias e hábitos</b>. Aqui não fazemos jejuns longos: no máximo 3 dias, com até 12 horas por dia e sempre bebendo água.</p>
<p class="read" style="font-size:16px;margin-top:10px"><b>Interrompa o jejum na hora</b>, coma algo leve e procure atendimento se sentir:</p><ul style="margin:8px 0 0;padding-left:20px">${J.pare.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
<label class="card row" style="align-items:flex-start;cursor:pointer;font-weight:500;font-size:15px;margin:0"><input type="checkbox" id="termoJejum" ${st.termo?'checked':''} style="width:24px;min-height:24px;flex:none;margin-top:2px"><span>${esc(J.termo)}</span></label>
<div class="stack" style="gap:10px"><h2>Escolha o seu jejum</h2>${J.planos.map(p=>{const pr=st.planos[p.id],n=pr?pr.feitos.length:0;return`<button class="item" data-act="abrirJejum" data-id="${p.id}"><span style="flex:1"><span class="eyebrow">${esc(p.tipo)}</span><b>${esc(p.t)}</b><span class="muted">${esc(p.desc)}</span>${pr?`<span class="small muted" style="display:block;margin-top:4px">${n} de ${p.dias.length} dias concluídos</span>`:''}</span>${ic('chev')}</button>`}).join('')}</div></div>`}
function vPlanoJejum(id){const J=QG.jejum,p=J.planos.find(x=>x.id===id),st=jj();if(!p||!st.termo)return vJejum();const pr=st.planos[id]||{feitos:[]};
return`<div class="stack" style="gap:16px"><button class="link" data-go="jejum" style="align-self:flex-start">${ic('back')} Jornada de Jejum</button><span class="eyebrow">${esc(p.tipo)}</span><h1>${esc(p.t)}</h1>
<div class="block champ"><h3>Como fazer</h3><p class="read" style="font-size:16px">${esc(p.janela)}</p></div>
${p.dias.map((d,i)=>{const ok=pr.feitos.includes(i+1);return`<div class="card stack" style="gap:12px"><div class="row between"><h2 style="font-size:18px">${esc(d.t)}</h2>${ok?'<span class="chip ok">Concluído</span>':''}</div><p class="verso" style="font-size:19px">${esc(d.ref)}</p><p class="read" style="font-size:16px"><b>Foco:</b> ${esc(d.foco)}</p>${passosHTML(d.pratica)}<div class="block rose"><h3>Oração</h3><p class="read" style="font-size:16px">${esc(d.oracao)}</p></div>${ok?'':`<button class="btn" data-act="diaJejum" data-id="${id}" data-n="${i+1}">${ic('check')} Concluí este dia</button>`}</div>`}).join('')}
<p class="small muted">Lembre: a responsabilidade pelo seu jejum é sua. Se o corpo der sinais de mal-estar, interrompa e cuide-se.</p></div>`}

/* ===== QUIZ ===== */
let quiz=null;
function novoQuiz(){const idx=QG.quiz.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,10);quiz={qs:idx,i:0,acertos:0,resp:null};render()}
function vQuiz(){const Q=QG.quiz,best=(db.quiz||{}).melhor||0;
if(!quiz)return`<div class="stack" style="gap:16px"><button class="link" data-go="trilhas" style="align-self:flex-start">${ic('back')} Trilhas</button><h1>Quiz bíblico</h1><p class="muted">Rodadas de 10 perguntas sorteadas entre ${Q.length}, com explicação em cada resposta. Abra a sua Bíblia e aprenda brincando.</p><div class="card"><p style="font-weight:600">Seu melhor resultado: ${best} de 10</p></div><button class="btn" data-act="quizNovo">Começar uma rodada</button></div>`;
if(quiz.i>=quiz.qs.length)return`<div class="stack" style="gap:16px;text-align:center"><h1>${quiz.acertos} de 10</h1><p class="muted">${quiz.acertos===10?'Perfeito! A Palavra está guardada no seu coração.':quiz.acertos>=7?'Muito bem! Continue firme na Palavra.':'Cada rodada é uma chance de aprender mais. Continue!'}</p><button class="btn" data-act="quizNovo">Jogar outra rodada</button><button class="link" data-go="trilhas">Voltar às trilhas</button></div>`;
const q=Q[quiz.qs[quiz.i]],r=quiz.resp;
return`<div class="stack" style="gap:16px"><div class="row between"><button class="link" data-act="quizSair">${ic('back')} Sair</button><span class="small muted">Pergunta ${quiz.i+1} de 10 · ${quiz.acertos} acertos</span></div>
<div class="steps">${quiz.qs.map((_,i)=>`<i class="${i<=quiz.i?'on':''}"></i>`).join('')}</div><h1 style="font-size:24px">${esc(q[0])}</h1>
<div class="stack" style="gap:10px">${q[1].map((o,i)=>{let st='';if(r!==null){if(i===q[2])st='background:var(--sage-soft);border-color:var(--sage);color:var(--sage)';else if(i===r)st='background:var(--rose-soft);border-color:var(--rose)'}return`<button class="item" data-act="quizResp" data-i="${i}" ${r!==null?'disabled':''} style="${st}"><span>${esc(o)}</span>${r!==null&&i===q[2]?ic('check'):''}</button>`}).join('')}</div>
${r!==null?`<div class="block ${r===q[2]?'champ':'rose'}"><h3>${r===q[2]?'Isso mesmo!':'Quase!'}</h3><p class="read" style="font-size:16px">${esc(q[3])}</p></div><button class="btn" data-act="quizProx">${quiz.i<9?'Próxima pergunta':'Ver resultado'}</button>`:''}</div>`}

/* ===== DEVOCIONAL ===== */
let devOff=0;
function devIdx(){const d=parse(today()),ini=new Date(d.getFullYear(),0,1);return(((Math.round((d-ini)/864e5)+devOff)%QG.devocional.length)+QG.devocional.length)%QG.devocional.length}
function vDevocional(){const d=QG.devocional[devIdx()],dia=addDays(today(),devOff);
return`<div class="stack" style="gap:16px"><button class="link" data-go="hoje" style="align-self:flex-start">${ic('back')} Hoje</button><span class="eyebrow">Palavra do dia · ${fShort(dia)}</span><h1>${esc(d[1])}</h1><p class="verso">${esc(d[0])}</p><p class="read">${esc(d[2])}</p>
<div class="block rose"><h3>Oração</h3><p class="read" style="font-size:16px">${esc(d[3])}</p></div><div class="block champ"><h3>Passo de hoje</h3><p class="read" style="font-size:16px">${esc(d[4])}</p></div>
<div class="row between"><button class="link" data-act="devAnt">${ic('back')} Dia anterior</button>${devOff<0?`<button class="link" data-act="devProx">Próximo dia ${ic('chev')}</button>`:''}</div></div>`}

/* ===== SELOS E CONQUISTAS ===== */
function maxSeq(){const ds=Object.keys(db.turnos||{}).sort();let m=0,c=0,prev=null;for(const d of ds){c=prev&&diff(prev,d)===1?c+1:1;m=Math.max(m,c);prev=d}return m}
function trilhaOk(id){const tr=QG.trilhas[id];return!!tr&&feitasDe(tr)===tr.itens.length}
function selos(){const nt=Object.keys(db.turnos||{}).length,na=Object.values(db.aulas||{}).filter(x=>x.feito).length,J=db.jejum||{planos:{}};
const jejumOk=QG.jejum&&QG.jejum.planos.some(p=>(J.planos[p.id]||{feitos:[]}).feitos.length>=p.dias.length);
return[['primeiro','Primeiro passo','Concluiu o primeiro turno de vigia',nt>=1],['sete','Constância','7 dias seguidos no quarto de guerra',maxSeq()>=7],['vinteum','Vigilante','21 turnos de vigia concluídos',nt>=21],['campanha','Muro de pé','Concluiu uma campanha inteira',CAMPANHAS.some(c=>nFeitos(c)>=c.dias.length)],
['aula','Aluna','Concluiu a primeira aula das trilhas',na>=1],['escola','Escola de Oração','Concluiu a Escola de Oração',trilhaOk('escola')],['formacao','Mulher em formação','Concluiu a Formação da Mulher Cristã',trilhaOk('formacao')],['parabolas','Ouvinte das parábolas','Concluiu os estudos das parábolas',trilhaOk('parabolas')],
['jejum','Primeiro jejum','Concluiu uma proposta de jejum',!!jejumOk],['vitoria','Testemunha','Registrou a primeira vitória',pedidos().some(p=>p.resp)],['quiz','Conhecedora da Palavra','Acertou 10 de 10 no quiz',((db.quiz||{}).melhor||0)>=10],['diag','Olhar honesto','Fez o diagnóstico do coração',!!db.diag]].map(([id,t,d,ok])=>({id,t,d,ok}))}
function checarSelos(){if(!db)return;db.selosVistos=db.selosVistos||[];const novos=selos().filter(s=>s.ok&&!db.selosVistos.includes(s.id));if(novos.length){db.selosVistos.push(...novos.map(s=>s.id));setTimeout(()=>toast('Nova conquista: '+novos[0].t),900)}}
function vConquistas(){const ss=selos(),n=ss.filter(s=>s.ok).length;return`<div class="stack" style="gap:16px"><button class="link" data-go="hoje" style="align-self:flex-start">${ic('back')} Hoje</button><h1>Minhas conquistas</h1><p class="muted">${n} de ${ss.length} selos conquistados</p>
<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">${ss.map(s=>`<div class="card stack" style="gap:6px;text-align:center;align-items:center;${s.ok?'':'opacity:.5'}"><span style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${s.ok?'var(--rose)':'var(--line)'};color:${s.ok?'var(--rose-ink)':'var(--muted)'}">${ic(s.ok?'vitorias':'lock')}</span><b style="font-weight:600;font-size:15px">${esc(s.t)}</b><span class="small muted">${esc(s.d)}</span></div>`).join('')}</div></div>`}

/* ===== DIAGNÓSTICO DO CORAÇÃO ===== */
const AREAS=[['oracao','Vida de oração','aula-escola-2','O quarto secreto (Escola de Oração)'],['emocoes','Emoções','aula-formacao-3','Emoções: sentir sem ser governada'],['identidade','Identidade e autoestima','aula-formacao-1','Identidade: quem eu sou em Deus'],['afetiva','Casamento e vida afetiva','aula-formacao-4','Vida afetiva: amar e ser amada com saúde'],['familia','Filhos e família','aula-parabolas-8','A casa na rocha (Parábolas)'],['financas','Finanças','aula-formacao-5','Finanças: mordomia, paz e sabedoria'],['proposito','Propósito','aula-formacao-6','Propósito: para um tempo como este']];
function vDiagnostico(){const dg=db.diag;
if(dg&&!diagRefazer){const ord=AREAS.slice().sort((a,b)=>dg.notas[a[0]]-dg.notas[b[0]]).slice(0,2);
return`<div class="stack" style="gap:16px"><button class="link" data-go="hoje" style="align-self:flex-start">${ic('back')} Hoje</button><h1>O seu diagnóstico</h1><p class="muted">Feito em ${fShort(dg.data)}. Estes são os muros que mais precisam de cuidado agora:</p>
${ord.map(a=>`<div class="card stack" style="gap:8px"><div class="row between"><h2 style="font-size:18px">${esc(a[1])}</h2><span class="chip">${dg.notas[a[0]]} de 5</span></div><p class="small muted">Comece por aqui:</p><button class="item" data-go="${a[2]}"><span><b>${esc(a[3])}</b></span>${ic('chev')}</button></div>`).join('')}
<div class="block champ"><h3>Próximo passo</h3><p class="read" style="font-size:16px">Abra o seu Mapa de Batalha e coloque pedidos nessas frentes. Faça o seu turno de vigia todos os dias: é ali que a reconstrução acontece.</p></div>
<button class="btn line" data-act="diagRefazer">Refazer o diagnóstico</button></div>`}
return`<div class="stack" style="gap:16px"><button class="link" data-go="hoje" style="align-self:flex-start">${ic('back')} Hoje</button><h1>Diagnóstico do coração</h1><p class="muted">Como estão os muros da sua vida hoje? Dê uma nota de 1 (derrubado) a 5 (firme) para cada área. Seja sincera: só você vê.</p>
<form id="fDiag" class="stack" style="gap:12px">${AREAS.map(a=>`<fieldset class="card" style="margin:0"><legend style="font-weight:600;padding:0 4px">${esc(a[1])}</legend><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:8px">${[1,2,3,4,5].map(n=>`<label style="margin:0;display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:500;cursor:pointer"><input type="radio" name="${a[0]}" value="${n}" required style="width:22px;min-height:22px">${n}</label>`).join('')}</div></fieldset>`).join('')}
<p id="erroD" class="small" style="color:var(--rose)" role="alert"></p><button class="btn" type="submit">Ver o meu resultado</button></form></div>`}
let diagRefazer=false;

/* ===== A VANESSA ORA POR VOCÊ ===== */
function sheetOracao(){sheet(`<form id="fOracao" class="stack"><h2>A Vanessa ora por você</h2><p class="muted">Escreva o seu pedido de oração. A Vanessa lê os pedidos e ora por eles, inclusive nas lives mensais.</p><div><label for="opedido">Meu pedido</label><textarea id="opedido" maxlength="1500" required placeholder="Escreva com as suas palavras"></textarea></div>
<label class="row" style="font-weight:500;font-size:14px;cursor:pointer;margin:0"><input type="checkbox" id="ocitar" style="width:22px;min-height:22px;flex:none"> Pode citar o meu primeiro nome na live</label><p id="omsg" class="small muted" role="status"></p><button class="btn" type="submit">Enviar meu pedido</button><button class="link" type="button" data-act="fechar">Cancelar</button></form>`)}
let pedidosAdm=null;
function carregarPedidos(){if(!sb)return;sb.from('pedidos_oracao').select('*').order('criado',{ascending:false}).limit(200).then(({data,error})=>{pedidosAdm=error?[]:data;render()})}
function vPedidos(){if(!isAdmin())return vHoje();if(pedidosAdm===null){carregarPedidos();return'<p class="muted">Carregando pedidos...</p>'}
const ab=pedidosAdm.filter(p=>!p.orado);return`<div class="stack" style="gap:14px"><button class="link" data-go="perfil" style="align-self:flex-start">${ic('back')} Perfil</button><h1>Pedidos de oração</h1><p class="muted">${ab.length} aguardando oração · ${pedidosAdm.length} no total</p>
${pedidosAdm.map(p=>`<div class="card stack" style="gap:8px;${p.orado?'opacity:.6':''}"><p class="small muted">${new Date(p.criado).toLocaleDateString('pt-BR')} · ${esc(p.nome||'Sem nome')} ${p.citar_nome?'<span class="chip ok">Pode citar o nome</span>':'<span class="chip off">Não citar o nome</span>'}</p><p style="white-space:pre-line">${esc(p.pedido)}</p>${p.orado?'<span class="chip ok" style="align-self:flex-start">Orado</span>':`<button class="btn small" data-act="orei" data-id="${p.id}" style="align-self:flex-start">${ic('check')} Orei</button>`}</div>`).join('')||'<p class="muted">Nenhum pedido ainda.</p>'}</div>`}

/* ===== LEMBRETE DIÁRIO ===== */
function icsLembrete(h){const[hh,mm]=h.split(':'),d=today().replace(/-/g,''),url=location.origin+location.pathname,now=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Quarto de Guerra//PT','BEGIN:VEVENT','UID:qg-lembrete-'+Date.now()+'@quartodeguerra','DTSTAMP:'+now,'DTSTART:'+d+'T'+hh+mm+'00','DURATION:PT15M','RRULE:FREQ=DAILY','SUMMARY:Meu turno no Quarto de Guerra','DESCRIPTION:Hora de entrar no seu quarto secreto: '+url,'URL:'+url,'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Hora do seu turno de vigia','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n')}
function googleLembrete(h){const[hh,mm]=h.split(':'),d=today().replace(/-/g,''),fim=new Date(2000,0,1,+hh,+mm+15),f=pad(fim.getHours())+pad(fim.getMinutes());
return'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Meu turno no Quarto de Guerra')+'&details='+encodeURIComponent('Hora de entrar no seu quarto secreto: '+location.origin+location.pathname)+'&dates='+d+'T'+hh+mm+'00/'+d+'T'+f+'00&recur='+encodeURIComponent('RRULE:FREQ=DAILY')}

/* ===== PLANNER DO MÊS ===== */
function vPlanner(){const c=camp()||prox();if(!c)return vCampanha();
return`<div class="stack planner" style="gap:14px"><div class="row between noprint"><button class="link" data-go="campanha">${ic('back')} Campanha</button><button class="btn small" data-act="imprimir">Imprimir ou salvar PDF</button></div>
<div style="text-align:center"><p class="eyebrow">Quarto de Guerra · Campanha de ${c.mes.toLowerCase()}</p><h1 style="font-size:26px">${esc(c.titulo)}</h1><p class="small muted">${esc(c.resumo)}</p></div>
<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="text-align:left;border-bottom:2px solid var(--rose)"><th style="padding:6px 4px">Dia</th><th style="padding:6px 4px">Tema e passagem</th><th style="padding:6px 4px">Desafio</th><th style="padding:6px 4px">Feito</th></tr></thead><tbody>
${c.dias.map((d,i)=>`<tr style="border-bottom:1px solid var(--line);vertical-align:top"><td style="padding:6px 4px;white-space:nowrap">${i+1}<br><span class="muted">${(x=>x.getDate()+'/'+pad(x.getMonth()+1))(parse(addDays(c.inicio,i)))}</span></td><td style="padding:6px 4px"><b style="font-weight:600">${esc(d.t)}</b><br><span class="muted">${esc(d.r)}</span></td><td style="padding:6px 4px">${esc(d.c)}</td><td style="padding:6px 4px"><span style="display:inline-block;width:16px;height:16px;border:1.5px solid var(--rose);border-radius:4px"></span></td></tr>`).join('')}</tbody></table>
<p class="small muted" style="text-align:center">“Entre no seu quarto e, fechada a porta, ore a seu Pai.” Mateus 6.6</p></div>`}

/* ===== ROTAS ===== */
const TABS=[['hoje','Hoje'],['campanha','Campanha'],['trilhas','Trilhas'],['mapa','Mapa'],['secreto','Secreto']];
function route(){return(location.hash||'#hoje').slice(1)}
function render(){const app=$('#app'),tabs=$('#tabs');
if(authState==='carregando'){app.innerHTML=vCarregando();tabs.hidden=true;return}
if(authState==='erro'){app.innerHTML=vErro();tabs.hidden=true;return}
if(!session){app.innerHTML=vLogin();tabs.hidden=true;return}
if(needPass&&!DEMO){app.innerHTML=vCriarSenha();tabs.hidden=true;return}
if(bloqueio){app.innerHTML=vBloqueio();tabs.hidden=true;return}
if(!db)load();
if(turno){app.innerHTML=vTurno();tabs.hidden=true;return}
const r=route();let h;
if(r.startsWith('carta-'))h=vCarta(+r.split('-')[1]);
else if(r.startsWith('trilha-'))h=vTrilha(r.slice(7));
else if(r.startsWith('jejum-'))h=vPlanoJejum(r.slice(6));
else if(r.startsWith('aula-')){const p=r.split('-');h=vAula(p[1],+p[2])}
else h=({hoje:vHoje,mapa:vMapa,campanha:vCampanha,trilhas:vTrilhas,midia:vMidia,jejum:vJejum,quiz:vQuiz,devocional:vDevocional,conquistas:vConquistas,diagnostico:vDiagnostico,pedidos:vPedidos,planner:vPlanner,secreto:vSecreto,vitorias:vVitorias,perfil:vPerfil}[r]||vHoje)();
const sim=(DEMO||isAdmin())&&LS.get('qg_sim','');app.innerHTML=(DEMO||sim?'<p class="demo" style="margin-bottom:18px">'+(DEMO?'Modo demonstração':'Visão da Vanessa')+(sim?' · dia simulado: '+fShort(today()):'')+'</p>':'')+h;
const base=r.startsWith('carta-')?'campanha':(r.startsWith('trilha-')||r.startsWith('aula-')||r.startsWith('jejum')||r==='midia'||r==='quiz')?'trilhas':r==='planner'?'campanha':['devocional','conquistas','diagnostico'].includes(r)?'hoje':r==='vitorias'?'mapa':r;
tabs.hidden=false;tabs.innerHTML=TABS.map(([k,n])=>`<a href="#${k}" class="${base===k?'on':''}" ${base===k?'aria-current="page"':''}>${ic(k)}${n}</a>`).join('')}
function go(r){if(location.hash==='#'+r)render();else location.hash=r}
addEventListener('hashchange',()=>{scrollTo(0,0);if(route()!=='devocional')devOff=0;if(route()!=='quiz')quiz=null;if(route()!=='diagnostico')diagRefazer=false;render()});

function startTurno(c,dia){const ct=c?c.dias[dia-1]:livreHoje();
turno={camp:c,dia,step:0,ct,frente:(db.frentes.find(f=>c&&f.nome===c.frente)||db.frentes[0]||{}).id,ex:'',reg:[]};
const prev=c?db.feitos[c.id+'-'+dia]:db.turnos[today()];
if(prev&&typeof prev==='object'){turno.ex=prev.ex||'';turno.reg=(prev.reg||[]).slice()}
render();scrollTo(0,0)}
function grab(){if(!turno)return;const g=id=>{const e=document.getElementById(id);return e?e.value:null};
const ex=g('ex');if(ex!==null)turno.ex=ex;[0,1,2].forEach(i=>{const v=g('reg'+i);if(v!==null)turno.reg[i]=v});const f=g('frente');if(f)turno.frente=f}

/* ===== EVENTOS ===== */
document.addEventListener('click',e=>{
if(e.target===$('#overlay')){close();return}
const g=e.target.closest('[data-go]');if(g){close();go(g.dataset.go);return}
const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
if(a==='esqueci')sheet(`<form id="fEsqueci" class="stack"><h2>Esqueceu a senha?</h2><p class="muted">Digite o e-mail da sua compra. Você vai receber um link para criar uma senha nova.</p><div><label for="remail">E-mail</label><input id="remail" type="email" value="${esc(($('#email')||{}).value||'')}" required></div><p id="rmsg" class="small muted" role="status"></p><button class="btn" type="submit">Enviar link</button><button class="link" type="button" data-act="fechar">Fechar</button></form>`);
if(a==='plano')sheet(`<div class="stack"><h2>Assine o Quarto de Guerra</h2><p class="muted">Campanhas mensais, trilhas, jejum, devocional, quiz e a Vanessa orando por você.</p><a class="btn" href="${CONFIG.checkoutUrl}">Mensal · R$ 27 por mês</a><a class="btn soft" href="${CONFIG.checkoutAnual}">Anual · R$ 197 (economize R$ 127)</a><button class="link" data-act="fechar">Fechar</button></div>`);
if(a==='fechar')close();
if(a==='perfil')go('perfil');
if(a==='turno'){const c=camp();startTurno(c,c?diaDe(c):0)}
if(a==='cumpri'){db.turnos[today()].cumprido=true;const r=db.turnos[today()];if(r.camp&&db.feitos[r.camp+'-'+r.dia])db.feitos[r.camp+'-'+r.dia].cumprido=true;save();render();toast('Desafio cumprido. Continue firme!')}
if(a==='dia'){const c=camp();if(c)startTurno(c,+b.dataset.n)}
if(a==='respirar')sheet(`<div class="stack" style="text-align:center"><h2>Respire comigo</h2><div class="breath" aria-hidden="true">Respire</div><p class="muted">Inspire enquanto o círculo cresce (4 segundos). Solte o ar devagar enquanto ele diminui (6 segundos).</p><p class="verso">O Senhor é o meu pastor.</p><button class="btn" data-act="fechar">Terminei</button></div>`);
if(a==='sairTurno'){turno=null;render()}
if(a==='passoProx'){grab();turno.step++;render();scrollTo(0,0)}
if(a==='passoAnt'){grab();turno.step--;render();scrollTo(0,0)}
if(a==='concluir'){grab();const t=today(),ct=turno.ct,rec={titulo:ct.t,ref:ct.r,ancora:ct.a||null,ex:turno.ex,reg:turno.reg,perg:ct.g,desafio:ct.c,cumprido:false,dia:turno.dia,camp:turno.camp?.id||null};
const old=db.turnos[t];if(old&&old.titulo===rec.titulo)rec.cumprido=!!old.cumprido;
db.turnos[t]=rec;if(turno.camp)db.feitos[turno.camp.id+'-'+turno.dia]=rec;save();turno=null;go('hoje');toast('Turno concluído. Deus vê em secreto.')}
if(a==='frente')sheetFrente(b.dataset.id);
if(a==='novaFrente')sheet(`<form id="fFrente" class="stack"><h2>Nova frente</h2><div><label for="fnome">Nome da frente</label><input id="fnome" placeholder="Ex.: Chamado, Saúde, Ministério" required></div><div><label for="fprom">Promessa da Palavra (opcional)</label><input id="fprom" placeholder="Ex.: Salmo 91.1"></div><button class="btn" type="submit">Abrir frente</button><button class="link" type="button" data-act="fechar">Cancelar</button></form>`);
if(a==='responder')sheet(`<form id="fResp" class="stack" data-f="${b.dataset.f}" data-p="${b.dataset.p}"><h2>Glória a Deus!</h2><div><label for="nota">Como Deus respondeu? (opcional)</label><textarea id="nota" placeholder="Conte com as suas palavras"></textarea></div><button class="btn" type="submit">Guardar no Mural de Vitórias</button><button class="link" type="button" data-act="fechar">Cancelar</button></form>`);
if(a==='apagarPedido'){const f=db.frentes.find(x=>x.id===b.dataset.f);f.pedidos=f.pedidos.filter(p=>p.id!==b.dataset.p);save();render();sheetFrente(f.id)}
if(a==='apagarFrente'){const id=b.dataset.id;sheet(`<div class="stack"><h2>Apagar esta frente?</h2><p class="muted">Os pedidos e respostas dela também serão apagados.</p><button class="btn" data-act="confirmaApagar" data-id="${id}">Sim, apagar</button><button class="link" data-act="frente" data-id="${id}">Cancelar</button></div>`)}
if(a==='confirmaApagar'){db.frentes=db.frentes.filter(f=>f.id!==b.dataset.id);save();close();render()}
if(a==='carta')go('carta-'+b.dataset.i);
if(a==='abrirJejum'){if(!jj().termo){toast('Antes, leia as orientações e marque a caixinha');const t=$('#termoJejum');if(t)t.scrollIntoView({behavior:'smooth',block:'center'});return}go('jejum-'+b.dataset.id)}
if(a==='diaJejum'){const st=jj(),id=b.dataset.id;st.planos[id]=st.planos[id]||{inicio:today(),feitos:[]};const n=+b.dataset.n;if(!st.planos[id].feitos.includes(n))st.planos[id].feitos.push(n);save();render();toast('Dia concluído. Deus vê em secreto.')}
if(a==='quizNovo')novoQuiz();
if(a==='quizSair'){quiz=null;go('trilhas')}
if(a==='quizResp'&&quiz&&quiz.resp===null){const i=+b.dataset.i,q=QG.quiz[quiz.qs[quiz.i]];quiz.resp=i;if(i===q[2])quiz.acertos++;render()}
if(a==='quizProx'&&quiz){quiz.i++;quiz.resp=null;if(quiz.i>=quiz.qs.length){db.quiz=db.quiz||{melhor:0,rodadas:0};db.quiz.rodadas++;db.quiz.melhor=Math.max(db.quiz.melhor,quiz.acertos);save()}render();scrollTo(0,0)}
if(a==='devAnt'){devOff--;render()}
if(a==='devProx'){devOff=Math.min(0,devOff+1);render()}
if(a==='diagRefazer'){diagRefazer=true;render();scrollTo(0,0)}
if(a==='oracao')sheetOracao();
if(a==='verPedidos'){pedidosAdm=null;go('pedidos')}
if(a==='orei'&&sb){const id=b.dataset.id;sb.from('pedidos_oracao').update({orado:true}).eq('id',id).then(({error})=>{if(error){toast('Não foi possível marcar agora');return}const p=pedidosAdm.find(x=>String(x.id)===String(id));if(p)p.orado=true;render()})}
if(a==='imprimir')window.print();
if(a==='lembreteIcs'||a==='lembreteGoogle'){const h=($('#hlemb')||{}).value||'06:30';if(db){db.lembrete=h;save()}
if(a==='lembreteGoogle'){window.open(googleLembrete(h),'_blank');return}
const blob=new Blob([icsLembrete(h)],{type:'text/calendar'}),u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download='lembrete-quarto-de-guerra.ics';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Abra o arquivo baixado para adicionar o lembrete')}
if(a==='concluirAula'){const id=b.dataset.id,n=+b.dataset.n,k=aulaKey(id,n),old=db.aulas[k]||{},resp=[0,1,2,3].map(i=>{const e=document.getElementById('aq'+i);return e?e.value:''});db.aulas[k]={feito:true,data:old.data||today(),notas:(document.getElementById('anotacoes')||{}).value||'',resp,titulo:QG.trilhas[id].itens[n-1].t,trilha:QG.trilhas[id].titulo,perg:QG.trilhas[id].itens[n-1].perguntas};save();toast(old.feito?'Alterações salvas':'Aula concluída. Continue firme!');go('trilha-'+id)}
if(a==='novaVitoria'){const ab=pedidos().filter(p=>!p.resp);sheet(`<form id="fVit" class="stack"><h2>Registrar uma resposta</h2>${ab.length?`<div><label for="vped">Qual pedido foi respondido?</label><select id="vped"><option value="">Uma vitória nova, sem pedido</option>${ab.map(p=>`<option value="${p.frente.id}|${p.id}">${esc(p.frente.nome)} · ${esc(p.texto)}</option>`).join('')}</select></div>`:''}<div><label for="vtexto">O que Deus fez?</label><textarea id="vtexto" required></textarea></div><div><label for="vfr">Frente</label><select id="vfr">${db.frentes.map(f=>`<option value="${f.id}">${esc(f.nome)}</option>`).join('')}</select></div><button class="btn" type="submit">Guardar no mural</button><button class="link" type="button" data-act="fechar">Cancelar</button></form>`)}
if(a==='zerar')sheet(`<div class="stack"><h2>Recomeçar do zero?</h2><p class="muted">Isso apaga turnos, desafios, registros, pedidos e vitórias deste teste.</p><button class="btn" data-act="confirmaZerar">Sim, recomeçar</button><button class="link" data-act="fechar">Cancelar</button></div>`);
if(a==='confirmaZerar'){db=defaults();save();close();go('hoje');toast('Tudo zerado. Pode testar de novo!')}
if(a==='simHoje'){LS.del('qg_sim');render();toast('De volta para hoje')}
if(a==='sair'){if(sb)sb.auth.signOut();LS.del('qg_session');session=null;db=null;turno=null;bloqueio=null;needPass=false;history.replaceState(null,'',location.pathname);render()}
});
document.addEventListener('change',e=>{
if(e.target.id==='frente'){grab();render()}
if(e.target.id==='termoJejum'){jj().termo=e.target.checked;save()}
if(e.target.id==='prom'){const f=db.frentes.find(x=>x.id===e.target.dataset.id);f.promessa=e.target.value.trim();save();render();toast('Promessa ancorada')}
if(e.target.id==='sim'&&e.target.value){LS.set('qg_sim',e.target.value);render()}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,v=id=>(document.getElementById(id)?.value||'').trim();
if(f.id==='fLogin'){const em=v('email').toLowerCase(),pw=v('senha');
if(!/^\S+@\S+\.\S+$/.test(em)){$('#erro').textContent='Confira o seu e-mail.';return}
if(pw.length<4){$('#erro').textContent='Digite a sua senha.';return}
if(DEMO){const old=LS.get('qg_profile_'+em,{});session={email:em,nome:old.nome||''};LS.set('qg_session',session);load();go('hoje');if(!session.nome)pedirNome();return}
$('#erro').textContent='Entrando...';
sb.auth.signInWithPassword({email:em,password:pw}).then(({data,error})=>{if(error){$('#erro').textContent=/invalid/i.test(error.message)?'E-mail ou senha incorretos.':/confirm/i.test(error.message)?'Confirme o seu e-mail pelo link que enviamos.':'Não foi possível entrar agora. Tente de novo.';return}abrirSessao(data.user)})}
if(f.id==='fEsqueci'){const em=v('remail').toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em)){$('#rmsg').textContent='Confira o seu e-mail.';return}
if(DEMO){$('#rmsg').textContent='No modo demonstração, nenhum e-mail é enviado.';return}
$('#rmsg').textContent='Enviando...';sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname}).then(({error})=>{$('#rmsg').textContent=error?'Não foi possível enviar agora. Tente de novo em alguns minutos.':'Pronto! Confira a sua caixa de entrada e o spam.'})}
if(f.id==='fSenha'){const p1=v('ns1'),p2=v('ns2');if(p1.length<6){$('#erroS').textContent='Use pelo menos 6 caracteres.';return}if(p1!==p2){$('#erroS').textContent='As senhas não são iguais.';return}
$('#erroS').textContent='Salvando...';sb.auth.updateUser({password:p1}).then(({error})=>{if(error){$('#erroS').textContent='Não foi possível salvar. Abra o link do e-mail de novo.';return}needPass=false;history.replaceState(null,'',location.pathname+'#hoje');toast('Senha criada!');render();if(session&&!session.nome)pedirNome()})}
if(f.id==='fNome'||f.id==='fPerfil'){const n=v(f.id==='fNome'?'nnome':'pnome');session.nome=n;if(db){db.nome=n;save()}if(DEMO)LS.set('qg_session',session);LS.set('qg_profile_'+session.email,{nome:n});close();if(f.id==='fNome'&&db&&!db.diag){go('diagnostico')}else render();toast('Salvo')}
if(f.id==='fPedido'){const t=v('novoPedido');if(!t)return;const fr=db.frentes.find(x=>x.id===f.dataset.id);fr.pedidos.push({id:uid(),texto:t,criado:today()});save();render();sheetFrente(fr.id);toast('Pedido adicionado')}
if(f.id==='fDiag'){const notas={};for(const a of AREAS){const r=f.querySelector('input[name="'+a[0]+'"]:checked');if(!r){$('#erroD').textContent='Responda todas as áreas.';return}notas[a[0]]=+r.value}db.diag={data:today(),notas};diagRefazer=false;save();render();scrollTo(0,0)}
if(f.id==='fOracao'){const t=v('opedido');if(!t){$('#omsg').textContent='Escreva o seu pedido.';return}const citar=$('#ocitar').checked;
if(DEMO||!sb){close();toast('Pedido enviado (demonstração)');return}
$('#omsg').textContent='Enviando...';sb.from('pedidos_oracao').insert({user_id:session.id,email:session.email,nome:(session.nome||'').split(' ')[0],pedido:t,citar_nome:citar}).then(({error})=>{if(error){$('#omsg').textContent='Não foi possível enviar agora. Tente de novo.';return}close();toast('Pedido enviado. A Vanessa vai orar por você.')})}
if(f.id==='fFrente'){const n=v('fnome');if(!n)return;db.frentes.push({id:uid(),nome:n,promessa:v('fprom'),pedidos:[]});save();close();render();toast('Frente aberta')}
if(f.id==='fResp'){const fr=db.frentes.find(x=>x.id===f.dataset.f),p=fr.pedidos.find(x=>x.id===f.dataset.p);p.resp={data:today(),nota:v('nota')};save();close();render();toast('Guardado no Mural de Vitórias')}
if(f.id==='fVit'){const t=v('vtexto');if(!t)return;const sel=v('vped');
if(sel){const[fid,pid]=sel.split('|'),p=db.frentes.find(x=>x.id===fid).pedidos.find(x=>x.id===pid);p.resp={data:today(),nota:t}}
else{const fr=db.frentes.find(x=>x.id===v('vfr'))||db.frentes[0];fr.pedidos.push({id:uid(),texto:t,criado:today(),resp:{data:today(),nota:''}})}
save();close();render();toast('Glória a Deus!')}
});
init();
}

