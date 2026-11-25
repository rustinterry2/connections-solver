"use strict";
/* Connections Helper v2: browser port of the polished Pyto version. */
const $=id=>document.getElementById(id);
const inputs=Array.from({length:8},(_,i)=>$('word-'+i));
const tiles=[...document.querySelectorAll('.word-tile')];
const feedbackButtons=[...document.querySelectorAll('[data-feedback]')];
const allIndices=[0,1,2,3,4,5,6,7];
const state={words:[],partitions:[],remaining:[],selected:null,selectedKey:null,showOther:false,highlights:new Set(),solved:false,lastFeedback:null,history:[],ocrItems:[],busy:false};
function sentenceCase(word){return word.slice(0,1)+word.slice(1).toLowerCase();}
function groupLabel(group){return [...group].sort((a,b)=>a-b).map(i=>sentenceCase(state.words[i])).join(' · ');}
function partitionKey(part){return part.a.join(',');}
function chooseFour(){
 const result=[];
 for(let a=0;a<5;a++)for(let b=a+1;b<6;b++)for(let c=b+1;c<7;c++)for(let d=c+1;d<8;d++){
  const first=[a,b,c,d];if(!first.includes(0))continue;
  result.push({a:first,b:allIndices.filter(i=>!first.includes(i))});
 }
 return result;
}
function relationship(partition,guess){
 const overlap=partition.a.filter(i=>guess.includes(i)).length;
 return overlap===0||overlap===4?0:overlap===1||overlap===3?1:2;
}
function showMessage(text='',kind=''){
 const node=$('message');node.textContent=text;node.className='message'+(kind?' '+kind:'');node.hidden=!text;
}
function setBrowseMode(browse){
 inputs.forEach(el=>el.hidden=browse);tiles.forEach(el=>el.hidden=!browse);
 $('edit').hidden=!browse;
 $('subtitle').textContent=browse?'Tap words to highlight your combinations':'Enter the 8 remaining words';
 updateTiles();
}
function updateTiles(){
 tiles.forEach((el,i)=>{
  el.textContent=state.words[i]?sentenceCase(state.words[i]):'';
  const on=state.highlights.has(i);el.classList.toggle('active',on);
  el.setAttribute('aria-pressed',String(on));
  el.setAttribute('aria-label',(on?'Unhighlight ':'Highlight ')+(state.words[i]||'word'));
 });
 $('clear').classList.toggle('available',state.highlights.size>0);
}
function generate(){
 const words=inputs.map(el=>el.value.trim().replace(/\s+/g,' ').toUpperCase());
 if(words.some(w=>!w)){showMessage('Please enter all eight words.','error');return false;}
 if(new Set(words.map(w=>w.toLocaleLowerCase())).size!==8){showMessage('Each word must be different.','error');return false;}
 state.words=words;state.partitions=chooseFour();state.remaining=state.partitions.slice();
 state.selected=null;state.selectedKey=null;state.showOther=false;
 state.highlights.clear();state.solved=false;state.lastFeedback=null;state.history=[];
 setBrowseMode(true);showMessage();render();return true;
}
function editWords(){
 if(state.busy)return;
 setBrowseMode(false);state.words=[];state.partitions=[];state.remaining=[];
 state.selected=null;state.selectedKey=null;state.showOther=false;
 state.highlights.clear();state.solved=false;state.lastFeedback=null;state.history=[];
 showMessage('Edit your words, then tap Generate Options.');render();
}
function newPuzzle(){
 if(state.busy)return;
 inputs.forEach(el=>el.value='');editWords();showMessage();inputs[0].focus();
}
function selectGuess(part){
 if(state.solved)return;
 state.selected=[...(state.showOther?part.b:part.a)];
 state.selectedKey=partitionKey(part);render();
}
function setFeedback(result){
 if(!state.remaining.length){showMessage('Generate the options first.','error');return;}
 if(!state.selected){showMessage('Choose a combination first.','error');return;}
 if(state.solved){showMessage('Already solved. Generate again to start over.');return;}
 const possible=state.remaining.filter(p=>relationship(p,state.selected)===result);
 if(!possible.length){showMessage('No solutions fit that feedback. Check your previous guesses.','error');return;}
 state.history.push({guess:[...state.selected],result});
 state.remaining=possible;state.solved=result===0;state.lastFeedback=result;
 if(result===0){
  const other=allIndices.filter(i=>!state.selected.includes(i));
  showMessage('Solved! Other group: '+groupLabel(other),'success');
 }else{state.selected=null;state.selectedKey=null;showMessage();}
 render();
}
function undo(){
 if(!state.history.length)return;
 const last=state.history.pop();
 state.remaining=state.partitions.filter(part=>state.history.every(h=>relationship(part,h.guess)===h.result));
 state.solved=state.history.some(h=>h.result===0);
 state.lastFeedback=state.history.length?state.history[state.history.length-1].result:null;
 state.selected=[...last.guess];
 const found=state.partitions.find(p=>p.a.every(i=>state.selected.includes(i))||p.b.every(i=>state.selected.includes(i)));
 state.selectedKey=found?partitionKey(found):null;
 showMessage('Last feedback undone.');render();
}
function compareGroups(a,b){for(let i=0;i<4;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;}
function render(){
 updateTiles();
 $('feedback-caption').textContent=state.lastFeedback===null?'POSSIBLE COMBINATIONS':state.lastFeedback===0?'CORRECT':state.lastFeedback===1?'1 AWAY':'2 AWAY';
 $('solution-count').textContent=state.partitions.length?(state.solved?'Solved!':state.remaining.length+' solutions'):'Enter 8 words';
 $('selected-guess').textContent=state.solved?
  'Other: '+groupLabel(allIndices.filter(i=>!state.selected.includes(i))):
  state.selected?groupLabel(state.selected):state.partitions.length?'Choose your next combination':'Choose a combination';
 $('selected-guess').classList.toggle('has-selection',Boolean(state.selected));
 feedbackButtons.forEach(btn=>{
  btn.classList.toggle('last',Number(btn.dataset.feedback)===state.lastFeedback);
  btn.disabled=state.solved||state.busy;
 });
 $('undo').hidden=state.history.length===0;
 $('swap').setAttribute('aria-pressed',String(state.showOther));
 const list=$('solutions');list.replaceChildren();
 if(!state.remaining.length){
  if(!state.partitions.length){const div=document.createElement('div');div.className='empty-state';div.textContent='Enter eight words or upload a screenshot to see all 35 possible combinations.';list.append(div);}
  return;
 }
 const ordered=[...state.remaining].sort((p,q)=>compareGroups(state.showOther?p.b:p.a,state.showOther?q.b:q.a));
 const fragment=document.createDocumentFragment();
 ordered.forEach((part,index)=>{
  const group=state.showOther?part.b:part.a;
  const btn=document.createElement('button');btn.type='button';
  btn.className='solution-card'+(partitionKey(part)===state.selectedKey?' selected':'');
  btn.setAttribute('aria-label','Select '+group.map(i=>state.words[i]).join(', '));
  btn.setAttribute('aria-pressed',String(partitionKey(part)===state.selectedKey));
  const num=document.createElement('span');num.className='solution-index';num.textContent=String(index+1).padStart(2,'0');
  const words=document.createElement('span');words.className='solution-words';
  group.forEach(i=>{const chip=document.createElement('span');chip.className='solution-word'+(state.highlights.has(i)?' highlighted':'');chip.textContent=sentenceCase(state.words[i]);words.append(chip);});
  btn.append(num,words);btn.addEventListener('click',()=>selectGuess(part));fragment.append(btn);
 });
 list.append(fragment);fitSolutionText();
}
function fitSolutionText(){
 const rows=$('solutions').querySelectorAll('.solution-card');
 const canvas=fitSolutionText.canvas||(fitSolutionText.canvas=document.createElement('canvas'));
 const ctx=canvas.getContext('2d');if(!ctx)return;
 for(const row of rows){
  const words=row.querySelector('.solution-words');if(!words)continue;
  const labels=[...words.children];const usable=words.clientWidth-8;if(usable<=0)continue;
  let size=Math.min(14.5,window.innerWidth<540?13.5:14.5);
  for(;size>=9.5;size-=.5){
   ctx.font=size+'px -apple-system, Arial, sans-serif';
   const needed=labels.reduce((sum,x)=>sum+ctx.measureText(x.textContent).width+8,0)+6;
   if(needed<=usable)break;
  }
  row.style.setProperty('--solution-font',Math.max(size,9.5)+'px');
 }
}
function toggleWord(i){
 if(!state.partitions.length)return;
 if(state.highlights.has(i))state.highlights.delete(i);else state.highlights.add(i);
 updateTiles();
 document.querySelectorAll('.solution-card').forEach(row=>{
  const match=(row.getAttribute('aria-label')||'').slice(7).split(', ');
  [...row.querySelectorAll('.solution-word')].forEach((chip,j)=>{
   const wordIndex=state.words.indexOf(match[j]);chip.classList.toggle('highlighted',state.highlights.has(wordIndex));
  });
 });
}
function clearHighlights(){state.highlights.clear();updateTiles();document.querySelectorAll('.solution-word.highlighted').forEach(el=>el.classList.remove('highlighted'));}
function swap(){if(!state.partitions.length){showMessage('Generate options first.','error');return;}state.showOther=!state.showOther;render();}
/* Screenshot OCR runs on-device through Tesseract.js, downloaded on first import. */
function loadTesseract(){
 if(window.Tesseract)return Promise.resolve(window.Tesseract);
 if(loadTesseract.promise)return loadTesseract.promise;
 loadTesseract.promise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('OCR library unavailable'));
  script.onerror=()=>reject(Error('OCR download failed. Check internet access.'));
  document.head.append(script);
 }).catch(err=>{loadTesseract.promise=null;throw err;});
 return loadTesseract.promise;
}
function cleaned(text){return String(text||'').trim().replace(/\s+/g,' ').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'').toUpperCase();}

/*
 * An 8-tile screenshot has two rows of four colored rectangles.
 * Text recognition can split one tile into several lines (BIG BOX / STORE).
 * Locate tile backgrounds first and assign OCR text to its physical tile.
 */
async function detectEightTileGrid(file){
 if(typeof createImageBitmap!=='function')return null;
 let bmp;try{bmp=await createImageBitmap(file);}catch{return null;}
 try{
  const scale=Math.min(1,1600/Math.max(bmp.width,bmp.height));
  const w=Math.round(bmp.width*scale),h=Math.round(bmp.height*scale);
  if(w<320||h<160)return null;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)return null;
  context.drawImage(bmp,0,0,w,h);
  const rgba=context.getImageData(0,0,w,h).data;
  const corners=[[3,3],[w-4,3],[3,h-4],[w-4,h-4]];
  const bg=[0,1,2].map(channel=>{
   const v=corners.map(([x,y])=>rgba[(y*w+x)*4+channel]).sort((a,b)=>a-b);
   return (v[1]+v[2])/2;
  });
  function marked(x,y){
   let i=(y*w+x)*4;
   return Math.abs(rgba[i]-bg[0])+Math.abs(rgba[i+1]-bg[1])+
    Math.abs(rgba[i+2]-bg[2])>28;
  }
  function runs(length,test,min){
   const out=[];let start=-1;
   for(let i=0;i<=length;i++){
    const active=i<length&&test(i);
    if(active&&start<0)start=i;
    if(!active&&start>=0){if(i-start>=min)out.push([start,i]);start=-1;}
   }
   return out;
  }
  const upper=Math.round(.25*h),lower=Math.round(.75*h);
  const xs=runs(w,x=>marked(x,upper)&&marked(x,lower),Math.round(.12*w));
  if(xs.length!==4)return null;
  const centers=xs.map(([a,b])=>Math.floor((a+b)/2));
  const ys=runs(h,y=>centers.filter(x=>marked(x,y)).length>=3,Math.round(.16*h));
  if(ys.length!==2)return null;
  const widths=xs.map(([a,b])=>b-a),heights=ys.map(([a,b])=>b-a);
  const avg=a=>a.reduce((sum,v)=>sum+v,0)/a.length;
  if(widths.some(x=>Math.abs(x-avg(widths))>avg(widths)*.20)||
     heights.some(y=>Math.abs(y-avg(heights))>avg(heights)*.20))return null;
  if(xs.some(([a],i)=>i>0&&a-xs[i-1][1]<w*.008)||
     ys[1][0]-ys[0][1]<h*.008)return null;
  if(widths.reduce((sum,x)=>sum+x,0)<.68*w||
     heights.reduce((sum,y)=>sum+y,0)<.65*h)return null;
  const rects=[];
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){
   const [x0,x1]=xs[col],[y0,y1]=ys[row],inv=1/scale;
   rects.push({x0:x0*inv,x1:x1*inv,y0:y0*inv,y1:y1*inv,
    x:(x0+x1)*inv/2,y:(y0+y1)*inv/2});
  }
  return rects;
 }catch(e){console.warn('Tile detection unavailable, using normal OCR',e);return null;}
 finally{bmp.close?.();}
}

/* Tesseract v5 supports flat word boxes, nested word boxes, and line boxes. */
function positionedOcrParts(data){
 const valid=list=>(list||[]).filter(o=>{
  const b=o?.bbox;
  return b&&Number.isFinite(Number(b.x0))&&Number.isFinite(Number(b.y0))&&
   Number(b.x1)>Number(b.x0)&&Number(b.y1)>Number(b.y0)&&cleaned(o.text);
 });
 const words=valid(data.words);if(words.length)return words;
 const nested=[];
 for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])
  for(const line of paragraph.lines||[])for(const word of line.words||[])nested.push(word);
 if(valid(nested).length)return valid(nested);
 return valid(data.lines);
}
function wordsByTile(data,tiles){
 if(!tiles||tiles.length!==8)return null;
 const buckets=Array.from({length:8},()=>[]);
 for(const o of positionedOcrParts(data)){
  const b=o.bbox,x=(Number(b.x0)+Number(b.x1))/2,y=(Number(b.y0)+Number(b.y1))/2;
  const i=tiles.findIndex(t=>x>=t.x0&&x<=t.x1&&y>=t.y0&&y<=t.y1);
  if(i<0||b.x1-b.x0>(tiles[i].x1-tiles[i].x0)*1.12)continue;
  buckets[i].push({text:cleaned(o.text),x,y,height:b.y1-b.y0});
 }
 if(buckets.some(x=>!x.length))return null;
 return buckets.map((words,i)=>{
  const sizes=words.map(w=>w.height).sort((a,b)=>a-b);
  const gap=Math.max(5,Math.min((tiles[i].y1-tiles[i].y0)*.12,
   sizes[Math.floor(sizes.length/2)]*.6));
  const lines=[];
  for(const word of words.sort((a,b)=>a.y-b.y||a.x-b.x)){
   let row=lines.find(row=>Math.abs(row.y-word.y)<=gap);
   if(!row){row={y:word.y,words:[]};lines.push(row);}
   row.words.push(word);
  }
  return {text:cleaned(lines.sort((a,b)=>a.y-b.y)
    .map(line=>line.words.sort((a,b)=>a.x-b.x).map(w=>w.text).join(' ')).join(' ')),
   x:tiles[i].x,y:tiles[i].y};
 });
}

function bboxOf(o){const b=o.bbox||{};return{x:(Number(b.x0||0)+Number(b.x1||0))/2,y:(Number(b.y0||0)+Number(b.y1||0))/2};}
function gridOrder(items){
 const byY=[...items].sort((a,b)=>a.y-b.y);
 if(byY.length===8)return [...byY.slice(0,4).sort((a,b)=>a.x-b.x),...byY.slice(4).sort((a,b)=>a.x-b.x)];
 return byY;
}
function recognizeItems(data){
 const lines=(data.lines||[]).map(item=>({...bboxOf(item),text:cleaned(item.text)})).filter(i=>i.text&&i.text.length<=50);
 const words=(data.words||[]).map(item=>({...bboxOf(item),text:cleaned(item.text)})).filter(i=>i.text&&i.text.length<=50);
 const items=lines.length===8?lines:words.length===8?words:lines.length>2?lines:words.length?words:lines;
 if(items.length)return gridOrder(items);
 return String(data.text||'').split(/\r?\n/).map((text,i)=>({text:cleaned(text),x:0,y:i})).filter(i=>i.text);
}
async function resizeForOcr(file){
 if(!file.type.startsWith('image/'))return file;
 let bmp;try{bmp=await createImageBitmap(file);}catch{return file;}
 const longest=Math.max(bmp.width,bmp.height);
 if(longest<=2100){bmp.close();return file;}
 const ratio=2100/longest,canvas=document.createElement('canvas');
 canvas.width=Math.round(bmp.width*ratio);canvas.height=Math.round(bmp.height*ratio);
 canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);bmp.close();
 return new Promise(resolve=>canvas.toBlob(blob=>resolve(blob||file),'image/png'));
}
async function importImage(file){
 if(!file||state.busy)return;
 state.busy=true;for(const id of ['generate','upload','paste'])$(id).disabled=true;
 showMessage('Loading screenshot reader…');
 try{
  const [tesseract,image]=await Promise.all([loadTesseract(),resizeForOcr(file)]);
  showMessage('Reading screenshot… This may take a moment.');
  // Identify tile rectangles alongside OCR, then combine all lines in each tile.
  const [result,rectangles]=await Promise.all([
   tesseract.recognize(image,'eng',{logger:m=>{
    if(m.status==='recognizing text'&&Number.isFinite(m.progress))
     showMessage('Reading words… '+Math.round(m.progress*100)+'%');
   }}),
   detectEightTileGrid(image)
  ]);
  const data=result.data||{};
  const items=wordsByTile(data,rectangles)||recognizeItems(data);
  if(items.length===8){importItems(items);showMessage('Eight words imported. Check spellings.','success');}
  else if(items.length){state.ocrItems=items;drawReview(items);$('ocr-dialog').showModal();showMessage('Select the eight puzzle words from the recognized text.');}
  else showMessage('No words recognized. Try cropping to the eight remaining tiles.','error');
 }catch(err){console.error('Screenshot import error:',err);showMessage('Could not read screenshot. Please try another image or type words.','error');}
 finally{state.busy=false;for(const id of ['generate','upload','paste'])$(id).disabled=false;$('photo-file').value='';render();}
}
function drawReview(items){
 const area=$('ocr-choices');area.replaceChildren();
 items.forEach((item,i)=>{
  const label=document.createElement('label');label.className='ocr-choice';
  const check=document.createElement('input');check.type='checkbox';check.value=String(i);check.checked=items.length<=8;
  const span=document.createElement('span');span.textContent=item.text;
  label.append(check,span);area.append(label);
 });
}
function importItems(items){
 const ordered=gridOrder(items);
 inputs.forEach((input,i)=>{input.value=ordered[i]?.text||'';});
 $('ocr-dialog').close();
 if(!generate()){setBrowseMode(false);showMessage('Review the imported words and generate again.','error');}
}
async function pasteImage(){
 if(state.busy)return;
 if(!navigator.clipboard?.read){showMessage('Your browser cannot read image clipboard data. Use Upload Words instead.','error');return;}
 try{
  const items=await navigator.clipboard.read();
  for(const item of items){
   const type=item.types.find(t=>t.startsWith('image/'));
   if(type){await importImage(await item.getType(type));return;}
  }
  showMessage('Copy a screenshot first, then tap Paste.','error');
 }catch(err){console.warn('Clipboard access failed:',err);showMessage('Clipboard access unavailable. Try Upload Words or allow paste permission.','error');}
}
$('generate').addEventListener('click',generate);
$('upload').addEventListener('click',()=>$('photo-file').click());
$('photo-file').addEventListener('change',event=>importImage(event.target.files?.[0]));
$('paste').addEventListener('click',pasteImage);
$('edit').addEventListener('click',editWords);
$('clear').addEventListener('click',clearHighlights);
$('swap').addEventListener('click',swap);
$('undo').addEventListener('click',undo);
$('new-puzzle').addEventListener('click',newPuzzle);
$('close-review').addEventListener('click',()=>$('ocr-dialog').close());
$('import-eight').addEventListener('click',()=>{
 const selected=[...$('ocr-choices').querySelectorAll('input:checked')].map(el=>state.ocrItems[Number(el.value)]);
 if(selected.length!==8){showMessage('Choose exactly eight text items.','error');return;}
 importItems(selected);showMessage('Words imported. Check spellings.','success');
});
feedbackButtons.forEach(btn=>btn.addEventListener('click',()=>setFeedback(Number(btn.dataset.feedback))));
tiles.forEach((tile,i)=>tile.addEventListener('click',()=>toggleWord(i)));
inputs.forEach((input,i)=>input.addEventListener('keydown',event=>{
 if(event.key!=='Enter')return;event.preventDefault();
 if(i<7)inputs[i+1].focus();else{input.blur();generate();}
}));
document.addEventListener('paste',event=>{
 const file=[...(event.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));
 if(file){event.preventDefault();importImage(file);}
});
window.addEventListener('resize',()=>{if(state.remaining.length)fitSolutionText();});
setBrowseMode(false);render();