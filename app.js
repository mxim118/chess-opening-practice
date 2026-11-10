const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const GL={"K":"♚","Q":"♛","R":"♜","B":"♝","N":"♞","P":"♟"};
let board,root,node,path=[],op=null,cur=null,sel=null,over=true,lastSq=[],busy=false,hintSq=null;
const $=id=>document.getElementById(id);
const myTurn=()=>path.length%2===(op.side==="white"?0:1);
const isMine=p=>!!p&&(op.side==="white"?p===p.toUpperCase():p===p.toLowerCase());
const sideName=()=>op.side==="white"?"белых":"чёрных";
const sqi=s=>(8-+s[1])*8+(s.charCodeAt(0)-97);
const name=i=>String.fromCharCode(97+i%8)+(8-Math.floor(i/8));
function parse(s){return s.split(";").filter(Boolean).map(x=>{const[a,c]=x.split("|"),[u,s2]=a.split("/");return{u,s:s2,c:c||""}})}
function build(g){root={ch:[]};g.l.forEach(t=>{let n=root;parse(op.prefix+";"+g.p+";"+t).forEach(k=>{let c=n.ch.find(x=>x.u===k.u);if(!c){c={u:k.u,s:k.s,c:k.c,ch:[]};n.ch.push(c)}else if(!c.c)c.c=k.c;n=c})})}
function reset(){board=[];START.split("/").forEach(r=>{for(const c of r){if(+c)for(let k=0;k<+c;k++)board.push("");else board.push(c)}})}
function apply(u){
 const f=sqi(u.slice(0,2)),t=sqi(u.slice(2,4)),p=board[f];
 let cap=!!board[t];
 if(p.toLowerCase()==="k"&&Math.abs(t-f)===2){const r=t>f?[t+1,t-1]:[t-2,t+1];board[r[1]]=board[r[0]];board[r[0]]=""}
 if(p.toLowerCase()==="p"&&f%8!==t%8&&!board[t]){board[t+(p==="P"?8:-8)]="";cap=true}
 board[t]=p;board[f]="";lastSq=[f,t];return cap;
}
// Звуки лежат рядом с этим файлом: Move.mp3 (ход) и Capture.mp3 (взятие). При ошибке звука нет.
const SND="sounds/Move.mp3";
const SNDC="sounds/Capture.mp3";
function snd(k){if(k===2)return;try{const a=new Audio(k===1?SNDC:SND);a.play().catch(()=>{})}catch(e){}}
function draw(){
 const b=$("board");b.innerHTML="";
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const i=op.side==="white"?r*8+c:(7-r)*8+(7-c);
  const d=document.createElement("div");
  d.className="sq "+(((Math.floor(i/8)+i%8)%2)?"d":"l");
  if(sel===i)d.classList.add("sel");
  if(lastSq.includes(i))d.classList.add("last");
  if(hintSq&&hintSq.includes(i))d.classList.add("hint");
  d.dataset.i=i;d.setAttribute("role","gridcell");d.setAttribute("aria-label",name(i));
  const p=board[i];
  if(p){const s=document.createElement("span");s.className="p "+(p===p.toUpperCase()?"w":"b");s.textContent=GL[p.toUpperCase()]+"\uFE0E";d.appendChild(s)}
  if(c===0){const e=document.createElement("span");e.className="co r";e.textContent=8-Math.floor(i/8);d.appendChild(e)}
  if(r===7){const e=document.createElement("span");e.className="co f";e.textContent=String.fromCharCode(97+i%8);d.appendChild(e)}
  d.onclick=()=>click(i);b.appendChild(d);
 }
}
function setStatus(t,k){const s=$("status");s.textContent=t;s.className=k||""}
const FIG={N:"♞",B:"♝",R:"♜",Q:"♛",K:"♚"};
function fig(s){const f=FIG[s[0]];return f?`<i class="fg">${f}\uFE0E</i>${s.slice(1)}`:s}
function renderMoves(){
 let h="";const last=path.length-1;
 for(let i=0;i<path.length;i+=2){
  const a=path[i],b=path[i+1];
  h+=`<div class="mr"><b class="mn">${i/2+1}</b><span class="mv${i===last?" cur":""}">${fig(a.s)}</span><span class="mv${i+1===last?" cur":""}">${b?fig(b.s):""}</span></div>`;
 }
 $("moves").innerHTML=h;$("moves").scrollTop=1e5;
}
function refresh(){
 hintSq=(!over&&$("study").checked&&myTurn())?node.ch.flatMap(m=>[sqi(m.u.slice(0,2)),sqi(m.u.slice(2,4))]):null;
 draw();renderMoves();
}
function play(n){
 arrows=[];snd(apply(n.u)?1:0);path.push(n);node=n;
 $("idea").textContent=n.c?n.s+" — "+n.c:"";
}
function finish(){
 over=true;hintSq=null;
 const st=load(),k=op.id+"|"+cur.n;st[k]=(st[k]||0)+1;save(st);
 setStatus("Вариант пройден! Отлично.","ok");
 $("idea").textContent+=" Идея варианта: "+cur.d;
 refresh();showStats();
}
function step(){
 if(over)return;
 if(!node.ch.length){finish();return}
 if(!myTurn()){
  busy=true;refresh();
  setTimeout(()=>{
   play(node.ch[Math.floor(Math.random()*node.ch.length)]);busy=false;
   if(!node.ch.length){finish();return}
   setStatus("Ваш ход за "+sideName()+".");refresh()},450);
 }else{setStatus("Ваш ход за "+sideName()+".");refresh()}
}
function click(i){
 if(over||busy||!myTurn())return;
 const mine=j=>isMine(board[j]);
 if(sel===null){if(mine(i)){sel=i;draw()}return}
 if(i===sel){sel=null;draw();return}
 if(mine(i)){sel=i;draw();return}
 const u=name(sel)+name(i),m=node.ch.find(x=>x.u===u);
 if(m){
  sel=null;play(m);setStatus("Верно: "+m.s,"ok");
  if(!node.ch.length){finish();return}
  step();
 }else{
  sel=null;draw();
  const el=document.querySelector(`[data-i="${i}"]`);if(el)el.classList.add("bad");
  const s=load();s.err=(s.err||0)+1;save(s);
  setStatus("Это не теоретический ход. Попробуйте ещё раз или нажмите «Подсказка».","bad");
  showStats();
 }
}
// Стрелки и кружки: правая кнопка мыши (Shift — красная, Ctrl — синяя, Alt — жёлтая)
let arrows=[],aDown=null,aPrev=null;
const ACOL={g:"#15781b",r:"#c0392b",b:"#1f5fbf",y:"#e68f00"};
const xy=i=>op.side==="white"?[i%8+.5,Math.floor(i/8)+.5]:[7-i%8+.5,7-Math.floor(i/8)+.5];
function drawArrows(){
 const b=$("board"),o=b.querySelector("svg.ar");if(o)o.remove();
 const list=aPrev?arrows.concat([aPrev]):arrows;if(!list.length)return;
 let h="";
 list.forEach(a=>{
  const[x1,y1]=xy(a.f),[x2,y2]=xy(a.t),c=ACOL[a.c];
  if(a.f===a.t){h+=`<circle cx="${x1}" cy="${y1}" r=".45" fill="none" stroke="${c}" stroke-width=".07" opacity=".8"/>`;return}
  const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,ex=x2-ux*.38,ey=y2-uy*.38;
  h+=`<g fill="${c}" stroke="${c}" opacity=".8"><line x1="${x1+ux*.2}" y1="${y1+uy*.2}" x2="${ex}" y2="${ey}" stroke-width=".16" stroke-linecap="round"/><polygon stroke="none" points="${x2},${y2} ${ex-uy*.17},${ey+ux*.17} ${ex+uy*.17},${ey-ux*.17}"/></g>`;
 });
 b.insertAdjacentHTML("beforeend",`<svg class="ar" viewBox="0 0 8 8" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5">${h}</svg>`);
}
const _draw=draw;draw=function(){_draw();drawArrows()};
const sqAt=e=>{const t=document.elementFromPoint(e.clientX,e.clientY),s=t&&t.closest(".sq");return s?+s.dataset.i:null};
$("board").addEventListener("contextmenu",e=>e.preventDefault());
$("board").addEventListener("pointerdown",e=>{
 if(e.button!==2)return;e.preventDefault();
 const i=sqAt(e);if(i===null)return;
 aDown={f:i,c:e.shiftKey?"r":e.ctrlKey?"b":e.altKey?"y":"g"};
});
window.addEventListener("pointermove",e=>{if(!aDown)return;const i=sqAt(e);if(i===null)return;aPrev={f:aDown.f,t:i,c:aDown.c};drawArrows()});
window.addEventListener("pointerup",e=>{
 if(!aDown||e.button!==2)return;
 const i=sqAt(e),d=aDown;aDown=null;aPrev=null;
 if(i!==null){
  const k=arrows.findIndex(a=>a.f===d.f&&a.t===i);
  if(k>=0){const same=arrows[k].c===d.c;arrows.splice(k,1);if(!same)arrows.push({f:d.f,t:i,c:d.c})}
  else arrows.push({f:d.f,t:i,c:d.c});
 }
 drawArrows();
});
let drag=null;
$("board").addEventListener("pointerdown",e=>{
 if(e.button!==0)return;arrows=[];drawArrows();
 const sq=e.target.closest(".sq");if(!sq||over||busy||!myTurn())return;
 const i=+sq.dataset.i,p=board[i];
 if(!isMine(p))return;
 drag={from:i,x:e.clientX,y:e.clientY,moved:false,ghost:null,size:sq.offsetWidth,glyph:sq.querySelector(".p").textContent};
});
window.addEventListener("pointermove",e=>{
 if(!drag)return;
 if(!drag.moved){
  if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
  drag.moved=true;sel=drag.from;draw();
  const o=document.querySelector('[data-i="'+drag.from+'"] .p');if(o)o.style.opacity=.3;
  const g=document.createElement("div");g.className="ghost";g.textContent=drag.glyph;g.style.fontSize=(drag.size*.85)+"px";if(op.side==="white"){g.style.color="#fff";g.style.textShadow="0 0 2px #000,0 0 2px #000"}
  document.body.appendChild(g);drag.ghost=g;
 }
 drag.ghost.style.left=e.clientX+"px";drag.ghost.style.top=e.clientY+"px";
});
window.addEventListener("pointerup",e=>{
 if(!drag)return;
 const d=drag;drag=null;
 if(!d.moved)return;
 d.ghost.remove();
 const t=document.elementFromPoint(e.clientX,e.clientY),sq=t&&t.closest(".sq");
 if(sq&&+sq.dataset.i!==d.from){sel=d.from;click(+sq.dataset.i)}else{sel=null;draw()}
});
window.addEventListener("pointercancel",()=>{if(drag){if(drag.ghost)drag.ghost.remove();drag=null;sel=null;draw()}});
function load(){try{return JSON.parse(localStorage.getItem("chess-trainer")||"{}")}catch(e){return{}}}
function save(s){try{localStorage.setItem("chess-trainer",JSON.stringify(s))}catch(e){}}
function showStats(){
 const s=load();
 $("stats").innerHTML=op.groups.map(l=>`${l.n}: пройден ${s[op.id+"|"+l.n]||0} раз`).join("<br>")+`<br>Ошибок всего: ${s.err||0}`;
}
function begin(){
 const v=$("line").value;
 cur=v==="r"?op.groups[Math.floor(Math.random()*op.groups.length)]:op.groups[+v];
 arrows=[];build(cur);reset();node=root;path=[];sel=null;over=false;lastSq=[];busy=false;
 $("idea").textContent=v==="r"?"Вариант выбран случайно: поймите его по ходам соперника.":"";
 step();
}
$("start").onclick=begin;
$("hintBtn").onclick=()=>{
 if(over||busy||!myTurn())return;
 hintSq=[sqi(node.ch[0].u.slice(0,2))];draw();
 setStatus("Подсказка: ходите фигурой с зелёной клетки.","");
};
$("study").onchange=refresh;
// ===== Меню дебютов =====
function renderMenu(){
 const s=load();
 $("cards").innerHTML=OPENINGS.map(o=>{
  const done=Object.keys(s).filter(k=>k.startsWith(o.id+"|")).reduce((a,k)=>a+s[k],0);
  return `<button class="oc" data-id="${o.id}"><span class="bd">${o.side==="white"?"♔ За белых":"♚ За чёрных"}</span><b>${o.name}</b><span class="ln">${o.line}</span><span class="ds">${o.desc}</span><span class="pr">Вариантов в дебюте: ${o.groups.length} · пройдено раз: ${done}</span></button>`}).join("");
 $("cards").querySelectorAll(".oc").forEach(b=>b.onclick=()=>openOpening(OPENINGS.find(o=>o.id===b.dataset.id)));
}
function openOpening(o){
 op=o;cur=null;over=true;busy=false;sel=null;path=[];lastSq=[];arrows=[];hintSq=null;
 $("menu").hidden=true;$("trainer").hidden=false;
 $("title").textContent=o.name;
 $("sub").textContent=(o.side==="white"?"Тренажёр за белых: ":"Тренажёр за чёрных: ")+o.line;
 $("line").innerHTML=o.groups.map((g,i)=>`<option value="${i}">${g.n}</option>`).join("")+'<option value="r">Случайный вариант</option>';
 setStatus("Выберите вариант и нажмите «Начать».","");$("idea").textContent="";$("moves").innerHTML="";
 reset();draw();showStats();
}
$("back").onclick=()=>{over=true;busy=false;op=null;$("trainer").hidden=true;$("menu").hidden=false;renderMenu()};
renderMenu();
