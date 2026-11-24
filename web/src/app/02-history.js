/* ---------- undo / redo ---------- */
const snapState=()=>JSON.stringify({rooms:S.rooms,doors:S.doors,scale:S.scale,scaleLine:S.scaleLine});
function pushHist(){hist.push(snapState());if(hist.length>200)hist.shift();redoStack=[];updUndo()}
function restore(s){const d=JSON.parse(s);S.rooms=d.rooms;S.doors=d.doors;S.scale=d.scale;S.scaleLine=d.scaleLine;
 if(sel&&!(sel.t==='room'?room(sel.id):door(sel.id)))sel=null;applyScale();render()}
function undo(){if(draft.length){draft.pop();renderTemp();return}if(doorA||scaleA){doorA=null;scaleA=null;renderTemp();return}
 if(!hist.length)return;redoStack.push(snapState());restore(hist.pop());updUndo()}
function redo(){if(!redoStack.length)return;hist.push(snapState());restore(redoStack.pop());updUndo()}
function resetHist(){hist=[];redoStack=[];updUndo()}
function updUndo(){$('#bundo').disabled=!hist.length&&!draft.length;$('#bredo').disabled=!redoStack.length}

