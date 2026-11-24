(function(){
  function check(condition,message){if(!condition)throw Error(message)}
  try{
    S.rooms=FIXTURES['brief-house'].rooms.map(([id,name,type,pts])=>({id,name,type,pts}));
    S.doors=[];S.scale=null;GE=null;switchTab(2);
    const count=Object.keys(GE.nodes).length;
    $('#briefText').value='bedroom2需要在最安静的位置 因为是老人休息的地方';
    analyzeBrief();check(briefDraft.target==='r3'&&briefDraft.current.hops===null,'uncalibrated bedroom analysis');
    check(Object.keys(GE.nodes).length===count&&!activeBriefs().length,'preview mutated graph');
    applyBrief();check(activeBriefs()[0].target==='r3','apply quiet');
    $('#briefText').value='希望给主人添加一个工作的空间';analyzeBrief();
    check(briefDraft.kind==='study'&&briefDraft.anchor==='r3'&&briefDraft.access,'owner study preview');
    const expected=briefDraft.access;
    applyBrief();
    const study=activeBriefs().find(s=>s.kind==='study').target;
    check(Object.keys(GE.nodes).length===count+1,'new room count');
    analyzeBrief();applyBrief();
    check(Object.keys(GE.nodes).length===count+1&&activeBriefs().length===2,'duplicate workspace on repeat');
    const saved=JSON.parse(JSON.stringify(saveDesign()));
    geInit();restoreDesign(saved);renderGE();
    check(activeBriefs().length===2&&GE.nodes[study].isNew,'restore applied briefs');
    const input=genInput();
    check(input.edges.some(e=>e.hard&&[e.a,e.b].includes(study)&&[e.a,e.b].includes(expected)),'hard study door');
    const P=GEN.prepare(input),pool=[];
    for(let i=0;i<24;i++){const c=GEN.search(P,i,450,1);if(c)pool.push(c);if(pool.length>=4)break}
    GENRES=pickOptions(pool,2,P);gPick=0;renderRes();
    check(GENRES.length>0,'no option on real uncalibrated case '+JSON.stringify(P.stats));
    check($('#greport').innerHTML.includes('本方案的需求核对'),'missing option review');
    for(const c of GENRES){
      check(c.briefEvidence?.length===2&&c.doors.some(d=>[d.ra,d.rb].includes(study)&&[d.ra,d.rb].includes(expected)),'door or evidence missing');
      check(!c.rooms.some(r=>r.type==='study'&&r.id!==study),'duplicate generated study');
    }
    adopt(0);switchTab(2);
    check(activeBriefs().length===2&&activeBriefs().some(s=>s.target===study),'adopted requirements');
    geSnap();GE.briefs=[];geUndo();
    check(activeBriefs().length===2,'undo removal');
    check(!ERRS.length,ERRS.join(' / '));
    return JSON.stringify({ok:true});
  }catch(e){return JSON.stringify({ok:false,err:String(e.stack||e)})}
})()

