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
  const result=await tesseract.recognize(image,'eng',{logger:m=>{
   if(m.status==='recognizing text'&&Number.isFinite(m.progress))showMessage('Reading words… '+Math.round(m.progress*100)+'%');
  }});
  const items=recognizeItems(result.data||{});
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