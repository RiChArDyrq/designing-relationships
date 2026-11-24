function briefRoom(id,type,name,x,y,w=4,h=4){
  return {id,code:id,type,name,pts:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]};
}
test('briefs: bedroom codes, bilingual examples and ambiguity',()=>{
  const rooms=[briefRoom('B1','bedroom','Bedroom',0,0),briefRoom('B2','bedroom','Master Bedroom',8,0)];
  for(const text of ['bedroom2需要在最安静的位置，因为是老人休息的地方','卧室 2 需要安静','Quiet B2 for my mother'])
    assert(BRIEF.parse(text,rooms).target==='B2',text);
  assert(BRIEF.parse('Bedroom 20 needs quiet',rooms).error==='unknownBedroom');
  assert(BRIEF.parse('给老人一间安静卧室',rooms).choose.length===2);
  assert(BRIEF.parse('Quiet bedroom',rooms,'B1').target==='B1');
  assert(BRIEF.parse('希望给主人添加一个工作的空间',rooms).anchor==='B2');
  assert(BRIEF.parse('Add a working space for the owner',rooms).kind==='study');
  assert(BRIEF.parse('不要增加书房',rooms).error);
  assert(BRIEF.parse('增加自行车库',rooms).error);
});
test('briefs: noise, shared wall, corridor end and missing doors',()=>{
  const rooms=[briefRoom('L','living','Living',0,0),briefRoom('B1','bedroom','Bedroom 1',4,0),
    briefRoom('B2','bedroom','Bedroom 2',16,0),briefRoom('C','corridor','Hall',0,4,20,2)];
  const doors=[{a:'L',b:'C',m:[2,4]},{a:'B1',b:'L',m:[4,2]},{a:'C',b:'B2',m:[18,4]}];
  const goal={kind:'quiet',target:'B1'},m=BRIEF.model(rooms,doors),items=BRIEF.sites(m,goal);
  assert(items[0].id==='B2'&&items[0].end&&items[0].hops===2);
  assert(BRIEF.evidence(m,'B1',goal).walls.includes('L'));
  const empty=BRIEF.evidence(BRIEF.model(rooms,[]),'B2',goal);
  assert(!empty.end&&empty.hops===null);
  assert(!BRIEF.evidence(BRIEF.model(rooms,[{a:'C',b:'B2'}]),'B2',goal).end);
  const swapped=rooms.map(r=>({...r,pts:r.id==='B1'?rooms[2].pts:r.id==='B2'?rooms[1].pts:r.pts}));
  assert(BRIEF.evaluate(BRIEF.model(swapped,[]),[goal])[0].score>BRIEF.evaluate(BRIEF.model(rooms,[]),[goal])[0].score);
  const touch=BRIEF.model([rooms[0],briefRoom('B','bedroom','Bedroom',4,4)],[]);
  assert(!BRIEF.evidence(touch,'B',goal).walls.length);
});
test('briefs: study prefers proximity to owner and an entrance from common space',()=>{
  const rooms=[briefRoom('B','bedroom','Owner',0,0),briefRoom('S1','study','Study 1',0,4),
    briefRoom('S2','study','Study 2',20,4),briefRoom('C','corridor','Hall',0,8,24,2)];
  const m=BRIEF.model(rooms,[{a:'C',b:'S1'}]),s={kind:'study',anchor:'B'};
  const near=BRIEF.evidence(m,'S1',s),far=BRIEF.evidence(m,'S2',s);
  assert(near.score>far.score&&near.publicAccess.includes('C')&&near.anchorGap<far.anchorGap);
});

