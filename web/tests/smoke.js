// Fire the file input's change listeners the way a browser does after the user picks an image.
(function(){
  ERRS.length=0;
  const input=document.querySelector('#file');input.files=[{name:'plan.png'}];
  (input._L.change||[]).forEach(f=>{try{f({target:input})}catch(e){ERRS.push('change: '+(e&&e.stack||e))}});
  return JSON.stringify({listeners:(input._L.change||[]).length,img:!!S.img,w:S.w,h:S.h,errs:ERRS});
})()
