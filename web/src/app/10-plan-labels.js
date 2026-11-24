
const PlanLabels = (() => {
  const values={
    other:['Medium Screening Room A','Small Screening Room B','Small Screening Room C','Screening Room A','Screening Room B','Screening Room C','Cinema','Stage','Atrium','Parent Seating','Auditorium','Lobby','Gallery','Exhibition Hall','Meeting Room','Reception','Playground','Hall','Lounge','Multipurpose Room','Classroom','Office','Theatre','Theater','Mechanical Room'],
    entrance:['Memorial Archive Foyer','Entrance','Entry','Foyer','Entry Hall','Vestibule'],
    storage:['Back-of-Stage Storage','Backstage Storage','Public Storage','Storage','Store','Pantry','Closet'],
    dining:['Restaurant','Café','Cafe','Cafeteria','Dining Room','Dining'],
    bathroom:['All-Gender Toilets + Accessible Toilet','All-Gender Toilets','Accessible Toilet','Restroom','Restrooms','Bathroom','Bath','Toilet','Toilets','WC'],
    living:['Living Room','Living','Family Room'],bedroom:['Bedroom','Master Bedroom','Primary Bedroom','Bedroom 1','Bedroom 2','Bedroom 3','Bedroom 4'],
    courtyard:['Courtyard','Garden'],balcony:['Terrace','Patio','Balcony'],kitchen:['Kitchen'],study:['Study','Library'],garage:['Garage','Carport'],corridor:['Corridor','Hallway']
  };
  const phrases=[],chunks=new Set(),normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  for(const [type,names] of Object.entries(values))for(const name of names){
    const words=name.toUpperCase().split(' ');phrases.push({name,type,key:normalize(name)});
    for(let i=0;i<words.length;i++)for(let j=i+1;j<=words.length;j++)chunks.add(words.slice(i,j).join(' '));
  }
  const nx=64,ny=16, templates=[];
  function feature(mask,w,h,left,top,right,bottom){
    const out=new Float32Array(nx*ny),width=right-left+1,height=bottom-top+1;
    let total=0;
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
      if(!mask[y*w+x])continue;
      const u=(x-left)*nx/width,v=(y-top)*ny/height,r=u+nx/width,b=v+ny/height;
      for(let yy=Math.floor(v);yy<Math.min(ny,Math.ceil(b));yy++){
        const dy=Math.min(b,yy+1)-Math.max(v,yy);
        for(let xx=Math.floor(u);xx<Math.min(nx,Math.ceil(r));xx++)
          out[yy*nx+xx]+=dy*(Math.min(r,xx+1)-Math.max(u,xx));
      }
    }
    for(const v of out)total+=v*v;
    return {out,norm:Math.sqrt(total)||1,ratio:width/height};
  }
  function makeTemplates(){
    if(templates.length)return;
    const canvas=document.createElement('canvas');canvas.width=830;canvas.height=52;
    const g=canvas.getContext('2d',{willReadFrequently:true});
    for(const font of ['bold 29px Arial','900 29px "Arial Black"','bold 29px "Segoe UI"','bold 29px Calibri','29px Arial','bold 29px "Times New Roman"','bold 16px Arial','900 16px "Arial Black"','bold 16px Tahoma','bold 18px "Segoe UI"','bold 15px Calibri','bold 14px Arial']){
      g.font=font;
      for(const label of chunks){
        const w=Math.min(canvas.width,Math.ceil(g.measureText(label).width)+8);
        g.clearRect(0,0,w,52);g.fillText(label,3,36);
        const d=g.getImageData(0,0,w,52).data,m=new Uint8Array(w*52);
        let x0=w,y0=52,x1=-1,y1=-1;
        for(let i=0;i<m.length;i++)if(d[4*i+3]>=120){
          m[i]=1;const x=i%w,y=Math.floor(i/w);
          x0=Math.min(x,x0);x1=Math.max(x,x1);y0=Math.min(y0,y);y1=Math.max(y1,y);
        }
        if(x1>=x0)templates.push({...feature(m,w,52,x0,y0,x1,y1),label:normalize(label)});
      }
    }
  }
  function lineBoxes(mask,w,h) {
    const seen=new Uint8Array(mask.length),queue=new Int32Array(mask.length),components=[];
    for(let i=0;i<mask.length;i++){
      if(!mask[i]||seen[i])continue;
      let x0=w,x1=0,y0=h,y1=0,read=0,end=1;queue[0]=i;seen[i]=1;
      while(read<end){
        const j=queue[read++],x=j%w,y=Math.floor(j/w);
        x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
        for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){
          const n=yy*w+xx;if(mask[n]&&!seen[n]){seen[n]=1;queue[end++]=n}
        }
      }
      const height=y1-y0+1,width=x1-x0+1;
      if(height>=3&&height<=Math.max(40,h*.06)&&width<=height*12&&end>=3&&width*height<mask.length*.007)
        components.push({x0,x1,y0,y1,height});
    }
    const lines=[];
    components.sort((a,b)=>a.x0-b.x0||a.y0-b.y0);
    for(const r of components){
      let found=null,best=Infinity;
      for(let k=lines.length-1;k>=0;k--){
        const l=lines[k],overlap=Math.min(r.y1,l.y1)-Math.max(r.y0,l.y0)+1,gap=r.x0-l.x1-1;
        if(overlap<.40*Math.min(l.height,r.height)||Math.max(l.height,r.height)>2.1*Math.min(l.height,r.height)||
           gap>Math.max(l.height,r.height)*.95 || gap< -Math.max(l.height,r.height)*1.2)continue;
        const d=Math.max(0,gap)+Math.abs(l.y1-r.y1)*1.5;
        if(d<best){best=d;found=l}
      }
      if(found){found.x1=Math.max(found.x1,r.x1);found.y0=Math.min(found.y0,r.y0);found.y1=Math.max(found.y1,r.y1);found.height=found.y1-found.y0+1;}
      else lines.push({...r});
    }
    return lines.filter(l=>l.height>=5&&l.x1-l.x0>=l.height*1.35);
  }
  function alignment(f,t){
    // Small shifts in letter spacing accumulate across a word. Align narrow columns
    // of the two printed lines while preserving the reading order.
    let prev=new Float64Array(nx+1).fill(Infinity),next=new Float64Array(nx+1);
    prev[0]=0;
    for(let x=1;x<=nx;x++){
      next.fill(Infinity);
      for(let j=Math.max(1,x-5);j<=Math.min(nx,x+5);j++){
        let error=0;
        for(let y=0;y<ny;y+=2){const d=f.out[y*nx+x-1]-t.out[y*nx+j-1];error+=d*d}
        next[j]=error+Math.min(prev[j-1],prev[j]+1,next[j-1]+1);
      }
      [prev,next]=[next,prev];
    }
    return 1-Math.sqrt(prev[nx]/(nx*ny/2));
  }
  function match(l,mask,w,h){
    const f=feature(mask,w,h,l.x0,l.y0,l.x1,l.y1),scores=new Map();
    for(const t of templates){
      const delta=Math.abs(Math.log(f.ratio/t.ratio));if(delta>.31)continue;
      let dot=0;for(let i=0;i<f.out.length;i++)dot+=f.out[i]*t.out[i];
      const score=dot/f.norm/t.norm-.16*delta;
      if(score>(scores.get(t.label)?.score||0))scores.set(t.label,{score,t});
    }
    return [...scores.entries()].sort((a,b)=>b[1].score-a[1].score).slice(0,30)
      .map(([name,v])=>[name,v.score*.64+alignment(f,v.t)*.36+.065])
      .sort((a,b)=>b[1]-a[1]);
  }
  function read(mask,w,h,monochrome=false) {
    makeTemplates();
    const lines=lineBoxes(mask,w,h).filter(l=>l.x1-l.x0<l.height*26)
      .sort((a,b)=>b.height-a.height).slice(0,monochrome?220:380).sort((a,b)=>a.y0-b.y0||a.x0-b.x0);
    for(const l of lines)l.opts=match(l,mask,w,h);
    const useful=lines.filter(l=>l.opts[0]?.[1]>.69),results=[];
    function extend(group,opts) {
      const first=group[0],last=group[group.length-1];
      for(const {word,score} of opts){
        const phrase=phrases.find(p=>p.key===word);
        const threshold=monochrome?(group.length===1?.90:.84):.76;
        if(!phrase || score/group.length<threshold)continue;
        const x0=Math.min(...group.map(l=>l.x0)),x1=Math.max(...group.map(l=>l.x1));
        results.push({...phrase,group,score:score/group.length,x:(x0+x1)/2,y:(first.y0+last.y1)/2});
      }
      if(group.length===4)return;
      for(const l of useful){
        const gap=l.y0-last.y1-1,dx=Math.abs((last.x0+last.x1-l.x0-l.x1)/2);
        if(gap<0 || gap>Math.max(last.height,l.height)*.87 || dx>Math.max(last.x1-last.x0,l.x1-l.x0)*.46 ||
          Math.max(l.height,last.height)>Math.min(l.height,last.height)*1.7)continue;
        const next=[];
        for(const a of opts)for(const [s,val] of l.opts){
          const word=a.word+' '+s;
          if(val>=.62&&phrases.some(p=>p.key===word||p.key.startsWith(word+' ')))next.push({word,score:a.score+val});
        }
        if(next.length)extend([...group,l],next);
      }
    }
    for(const l of useful)extend([l],l.opts.filter(([word,score])=>score>.69&&phrases.some(p=>p.key===word||p.key.startsWith(word+' '))).map(([word,score])=>({word,score})));
    const used=new Set(),out=[];
    results.sort((a,b)=>b.group.length-a.group.length||b.score-a.score);
    for(const r of results){if(r.group.some(l=>used.has(l)))continue;r.group.forEach(l=>used.add(l));out.push(r)}
    return out.sort((a,b)=>a.y-b.y||a.x-b.x);
  }
  return {read};
})();


/* Candidate rooms are kept out of the editable project until accepted. */