
$('#eich').addEventListener('click',()=>{
  if(S.img && (S.rooms.length||S.doors.length) && !confirm(ui('打开独立 Eichler 示例会切换当前工程。继续吗？')))return;
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = EICHLER.image_size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#9b9b9b";
  for (const room of EICHLER.rooms) {
    ctx.beginPath();
    room.polygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.stroke();
  }
  setImage(canvas.toDataURL(),()=>{S.name="Eichler 住宅示例";importAnnotation(EICHLER,true,true)});
});
