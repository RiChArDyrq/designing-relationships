// Minimal fake browser for the smoke test. Records listeners so the test can fire them.
var ERRS=[];var console={log(){},warn(){},error(e){ERRS.push(String(e&&e.stack||e))}};
function fakeCtx(){return new Proxy({},{get(t,k){
  if(k==='getImageData')return (x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(255),width:w,height:h});
  if(k==='createImageData')return (w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h});
  if(k==='measureText')return ()=>({width:10});
  if(k in t)return t[k];return function(){}},set(t,k,v){t[k]=v;return true}})}
function mkEl(sel){const L={};const el={sel,_html:'',value:'',checked:false,hidden:false,disabled:false,textContent:'',className:'',dataset:{},style:{},children:[],files:[],_L:L,
  classList:{toggle(){},add(){},remove(){},contains(){return false}},
  addEventListener(t,f){(L[t]=L[t]||[]).push(f)},removeEventListener(){},setAttribute(k,v){this['@'+k]=v},getAttribute(k){return this['@'+k]},removeAttribute(){},
  getBoundingClientRect(){return{left:0,top:0,width:800,height:600}},querySelector(s){return mkEl(s)},querySelectorAll(){return[]},
  select(){},focus(){},blur(){},click(){},appendChild(){},append(){},remove(){},closest(){return null},contains(){return false},insertAdjacentHTML(){},
  offsetWidth:100,offsetHeight:30,getContext(){return fakeCtx()},toDataURL(){return 'data:image/png;base64,AA'}};
  Object.defineProperty(el,'innerHTML',{get(){return this._html},set(v){this._html=v}});return el}
const __els={};
var document={querySelector(s){return __els[s]||(__els[s]=mkEl(s))},querySelectorAll(){return[]},getElementById(s){return document.querySelector('#'+s)},
  createElement(){return mkEl('c')},createElementNS(){return mkEl('c')},execCommand(){},body:mkEl('body'),documentElement:mkEl('html'),addEventListener(){},title:''};
var window={addEventListener(){},matchMedia(){return{matches:false,addEventListener(){}}},devicePixelRatio:1};
var navigator={clipboard:{writeText(){}},language:'zh'};var localStorage={getItem(){return null},setItem(){}};
var setTimeout=function(f){try{f()}catch(e){ERRS.push('setTimeout: '+(e&&e.stack||e))}return 1};var clearTimeout=function(){};
var requestAnimationFrame=function(f){f();return 1};var performance={now(){return Date.now()}};
var Image=function(){const im={naturalWidth:0,naturalHeight:0};Object.defineProperty(im,'src',{set(v){im._s=v;im.naturalWidth=640;im.naturalHeight=480;
  try{im.onload&&im.onload()}catch(e){ERRS.push('Image.onload: '+(e&&e.stack||e))}},get(){return im._s}});return im};
var URL={createObjectURL(){return ''}};var Blob=function(){};
var FileReader=function(){const fr={};fr.readAsDataURL=function(){fr.result='data:image/png;base64,AAAA';try{fr.onload&&fr.onload()}catch(e){ERRS.push('FileReader.onload: '+(e&&e.stack||e))}};fr.readAsText=function(){};return fr};
var getComputedStyle=function(){return{getPropertyValue(){return ''}}};
var MutationObserver=function(){return{observe(){},disconnect(){}}};var ResizeObserver=MutationObserver;var Node={TEXT_NODE:3,ELEMENT_NODE:1};
