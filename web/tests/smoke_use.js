// Tab ①: one bedroom with a door at 1 px = 1 cm. Tab ②: tiny Lanai search, rank with the use check, render the report.
(function(){
  ERRS.length=0;const out={};
  S.scale=.01;S.rooms=[{id:'m',name:'Master Bedroom',type:'bedroom',pts:[[0,0],[400,0],[400,400],[0,400]]}];
  S.doors=[{id:'d',kind:'door',a:[300,400],b:[390,400]}];
  document.querySelector('#useShow').checked=true;
  render();
  out.tab1={pass:/✓/.test($('#useRep').innerHTML),bed:/bed-footprint/.test($('#luse').innerHTML),swing:/use-swing/.test($('#luse').innerHTML)};
  const fx=FIXTURES.lanai;
  S.scale=fx.scale_m_per_px;S.rooms=fx.rooms.map(([id,name,type,pts])=>({id,name,type,pts}));S.doors=[];
  switchTab(2);
  const P=GEN.prepare({rooms:fx.rooms.map(([id,name,type,pts])=>({id,name,type,pts,locked:false,original:labelPt(pts),seed:labelPt(pts),target:Math.abs(area(pts))})),
    edges:fx.edges.map(([a,b,kind,hard])=>({a,b,kind,hard})),scale:fx.scale_m_per_px,doorPx:.9/fx.scale_m_per_px});
  const pool=[];for(let i=0;i<6;i++){const c=GEN.search(P,i,1500,1);if(c)pool.push(c)}
  document.querySelector('#usePrefer').checked=true;document.querySelector('#showbeds').checked=true;
  GENRES=pickOptions(pool,3,P);gPick=0;renderRes();
  const rep=$('#greport').innerHTML;
  out.tab2={options:GENRES.length,report:/使用检查/.test(rep)&&/(主卧|次卧)/.test(rep),drawn:/bed-footprint|use-swing/.test($('#gprev').innerHTML)};
  out.errs=ERRS;return JSON.stringify(out);
})()
