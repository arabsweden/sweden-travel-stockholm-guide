/* Quiet home-page motion. React Bits-derived word reveal / Star Border geometry;
 * Light Rays shader in rays.js. License: vendor/react-bits-LICENSE.txt. */
(() => {
'use strict';
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v)),TAU=Math.PI*2,WHITE=[255,255,255];
const wrap = (value, total) => ((value % total) + total) % total;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (2 - 2 * t) ** 3 / 2);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (rgb, alpha) =>
  `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}, ${clamp(alpha, 0, 1).toFixed(3)})`;

const outline = (width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const arc = (Math.PI * r) / 2;
  const across = Math.max(0, width - 2 * r);
  const down = Math.max(0, height - 2 * r);
  const segments = [
    { length: across, x: r, y: 0, dx: 1, dy: 0, angle: null },
    { length: arc, x: width - r, y: r, dx: 0, dy: 0, angle: -Math.PI / 2 },
    { length: down, x: width, y: r, dx: 0, dy: 1, angle: null },
    { length: arc, x: width - r, y: height - r, dx: 0, dy: 0, angle: 0 },
    { length: across, x: width - r, y: height, dx: -1, dy: 0, angle: null },
    { length: arc, x: r, y: height - r, dx: 0, dy: 0, angle: Math.PI / 2 },
    { length: down, x: 0, y: height - r, dx: 0, dy: -1, angle: null },
    { length: arc, x: r, y: r, dx: 0, dy: 0, angle: Math.PI }
  ];
  return {
    r,
    segments,
    total: Math.max(
      1,
      segments.reduce((sum, segment) => sum + segment.length, 0)
    )
  };
};

const pointAt = (shape, distance, point) => {
  let s = wrap(distance, shape.total);
  for (const segment of shape.segments) {
    if (segment.length > 0 && s <= segment.length) {
      if (segment.angle === null) {
        point.x = segment.x + segment.dx * s;
        point.y = segment.y + segment.dy * s;
        point.nx = segment.dy;
        point.ny = -segment.dx;
      } else {
        const angle = segment.angle + s / shape.r;
        point.nx = Math.cos(angle);
        point.ny = Math.sin(angle);
        point.x = segment.x + point.nx * shape.r;
        point.y = segment.y + point.ny * shape.r;
      }
      return point;
    }
    s -= segment.length;
  }
  return point;
};


const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const touch=matchMedia('(pointer: coarse)');
let dispose=()=>{};
let alive=true;
function mountHome(){
 dispose(); dispose=()=>{};
 const hero=document.querySelector('#app .hero');
 if(!hero || !window.gsap || !window.ScrollTrigger || reduce.matches)return;
 const {gsap,ScrollTrigger}=window;
 gsap.registerPlugin(ScrollTrigger);
 gsap.ticker.lagSmoothing(0);
 const app=document.getElementById('app'), heading=hero.querySelector('h1'),original=heading.innerHTML;
 const cleanup=[],tweens=[],triggers=[];
 let lenis=null,visible=true;
 const track=tween=>{tweens.push(tween);if(tween.scrollTrigger)triggers.push(tween.scrollTrigger);return tween;};
 // Split by whole words, retaining line breaks, text order and Arabic shaping.
 const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{
 const f=document.createDocumentFragment();
 node.textContent.split(/(\s+)/).forEach(word=>{
 if(!word)return;
 if(/^\s+$/.test(word)){f.append(document.createTextNode(word));return;}
 const span=document.createElement('span');span.className='sg-word';span.textContent=word;f.append(span);
 });node.replaceWith(f);
 });
 heading.setAttribute('aria-label',original.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,''));
 heading.querySelectorAll('.sg-word').forEach(el=>el.setAttribute('aria-hidden','true'));
 track(gsap.fromTo(heading.querySelectorAll('.sg-word'),{filter:'blur(6px)',opacity:0,y:10},{filter:'blur(0px)',opacity:1,y:0,duration:.7,stagger:.065,ease:'power2.out',clearProps:'filter,opacity,transform'}));
 const sections=app.querySelectorAll('.planner-box,.featurestrip,.sectionhead,#globalform,.chips,#homecities > .card,.panel');
 sections.forEach((el,i)=>track(gsap.fromTo(el,{opacity:0,y:18},{opacity:1,y:0,duration:.6,delay:el.matches('.card')?(i%3)*.06:0,ease:'power2.out',clearProps:'opacity,transform',scrollTrigger:{trigger:el,start:'top 96%',once:true}})));
 // Only the existing destination count; prices and travel dates stay untouched.
 const label=app.querySelector('.featurestrip b');
 if(label){
 const text=label.textContent,found=text.match(/\d+/);
 if(found){
 const counter=document.createElement('span');counter.className='sg-count';counter.textContent=found[0];counter.setAttribute('aria-hidden','true');
 label.textContent='';label.setAttribute('aria-label',text);
 label.append(text.slice(0,found.index),counter,text.slice(found.index+found[0].length));
 const state={value:0};track(gsap.to(state,{value:Number(found[0]),duration:1.1,ease:'power2.out',scrollTrigger:{trigger:label,start:'top 96%',once:true},onStart:()=>{counter.textContent='0';},onUpdate:()=>{counter.textContent=String(Math.round(state.value));},onComplete:()=>{counter.textContent=found[0];}}));
 cleanup.push(()=>{label.textContent=text;label.removeAttribute('aria-label');});
 }}
 // One GSAP ticker drives Lenis, the light rays and Star Border.
 if(window.Lenis && !touch.matches){
 lenis=new Lenis({autoRaf:false,lerp:.1,syncTouch:false,prevent:node=>node.tagName==='DIALOG'||node.closest?.('dialog,#modal,.leaflet-container')});
 lenis.on('scroll',ScrollTrigger.update);
 cleanup.push(()=>{lenis.off('scroll',ScrollTrigger.update);lenis.destroy();});
 }
 let ray=null,rayCanvas=null,starCanvas=null,starContext=null;
 const button=hero.querySelector('a.btn');
 if(!touch.matches && window.SGRays){
 rayCanvas=document.createElement('canvas');rayCanvas.className='sg-light-rays';rayCanvas.setAttribute('aria-hidden','true');hero.prepend(rayCanvas);
 try{ray=window.SGRays(rayCanvas);}catch{rayCanvas.remove();}
 cleanup.push(()=>{ray?.destroy();rayCanvas.remove();});
 }
 if(button){
 button.classList.add('sg-star');
 starCanvas=document.createElement('canvas');starCanvas.className='sg-star-light';starCanvas.setAttribute('aria-hidden','true');button.append(starCanvas);
 starContext=starCanvas.getContext('2d');
 cleanup.push(()=>{starCanvas.remove();button.classList.remove('sg-star');});
 }
 const visibility=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);hero.classList.toggle('sg-motion-paused',!visible);});
 visibility.observe(hero);
 cleanup.push(()=>visibility.disconnect());
 let lastDraw=-1;
 const tick=time=>{
 lenis?.raf(time*1000);
 if(!visible || document.hidden || time-lastDraw<1/30)return;lastDraw=time;
 ray?.draw(time);
 if(starContext && button.isConnected){
 const w=button.offsetWidth,h=button.offsetHeight,dpr=Math.min(devicePixelRatio||1,1.5),cw=Math.round((w+16)*dpr),ch=Math.round((h+16)*dpr);
 if(starCanvas.width!==cw||starCanvas.height!==ch){starCanvas.width=cw;starCanvas.height=ch;}
 const ctx=starContext;ctx.setTransform(dpr,0,0,dpr,8*dpr,8*dpr);ctx.clearRect(-8,-8,w+16,h+16);
 const shape=outline(w-2,h-2,8),p={x:0,y:0},head=(time/12)*shape.total,trail=shape.total*.22;
 for(let i=0;i<35;i++){pointAt(shape,head-trail*i/35,p);const a={x:p.x,y:p.y};pointAt(shape,head-trail*(i+1)/35,p);ctx.beginPath();ctx.moveTo(a.x+1,a.y+1);ctx.lineTo(p.x+1,p.y+1);ctx.strokeStyle=rgba([18,63,84],.65*(1-i/35)**2);ctx.lineWidth=1.5;ctx.stroke();}
 }};
 gsap.ticker.add(tick);
 cleanup.push(()=>gsap.ticker.remove(tick));
 const refresh=()=>{if(alive)ScrollTrigger.refresh();};
 document.fonts?.ready.then(refresh);
 const onImage=()=>ScrollTrigger.refresh();app.addEventListener('load',onImage,true);
 cleanup.push(()=>app.removeEventListener('load',onImage,true));
 requestAnimationFrame(refresh);
 dispose=()=>{
 alive=false;
 triggers.forEach(t=>t.kill());tweens.forEach(t=>t.kill());
 cleanup.reverse().forEach(fn=>fn());
 gsap.set(sections,{clearProps:'opacity,transform'});
 heading.innerHTML=original;heading.removeAttribute('aria-label');
 alive=true;
 };
}
window.SGMotion={mountHome,cleanup:()=>{dispose();dispose=()=>{};}};
reduce.addEventListener('change',mountHome);
touch.addEventListener('change',mountHome);
window.addEventListener('pagehide',()=>{dispose();dispose=()=>{};});
window.addEventListener('pageshow',e=>{if(e.persisted)mountHome();});
})();

