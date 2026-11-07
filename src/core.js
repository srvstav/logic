export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
export function resolveTheme(mode,date=new Date()){return mode==='auto'?(date.getHours()>=7&&date.getHours()<19?'light':'dark'):mode;}
export function coverUV(viewAspect,imageAspect){return viewAspect>imageAspect?[1,imageAspect/viewAspect]:[viewAspect/imageAspect,1];}
export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function validateCatalog(items){if(!Array.isArray(items)||!items.length)throw Error('A non-empty image catalog is required.');return items.map((s,i)=>{if(!s.file||!s.title||!s.author||!s.license||!s.source)throw Error(`Catalog item ${i} is missing image or attribution fields.`);return {...s,id:s.id||String(i)};});}
