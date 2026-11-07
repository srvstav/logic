export const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const fragment=`
precision highp float;
uniform sampler2D imageA,imageB;
uniform float aspect,aspectA,aspectB,time,mixValue,light,seed,analysis;
uniform vec2 pointer,resolution;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+seed)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
vec2 fitted(vec2 uv,float a){vec2 scale=aspect>a?vec2(1.,a/aspect):vec2(aspect/a,1.);return (uv-.5)*scale+.5;}
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 plate(sampler2D tex,float imageAspect,vec2 uv,float phase){
 vec2 q=fitted(uv,imageAspect);
 float drift=sin(time*.07+seed)*.008;
 q=(q-.5)*(1.-.025*phase)+.5+vec2(drift,cos(time*.061+seed)*.005);
 vec2 offset=(pointer-.5)*.006;
 vec3 col=texture2D(tex,clamp(q+offset,.001,.999)).rgb;
 vec2 px=vec2(1./1200.,1./900.);
 float c=lum(col);
 float gx=lum(texture2D(tex,q+vec2(px.x,0.)).rgb)-lum(texture2D(tex,q-vec2(px.x,0.)).rgb);
 float gy=lum(texture2D(tex,q+vec2(0.,px.y)).rgb)-lum(texture2D(tex,q-vec2(0.,px.y)).rgb);
 float edge=clamp(length(vec2(gx,gy))*4.,0.,1.);
 float distanceToPointer=length((uv-pointer)*vec2(aspect,1.));
 float inspection=exp(-distanceToPointer*distanceToPointer*25.);
 float band=exp(-pow((uv.x-(sin(time*.14+seed)*.55+.5))*5.,2.));
 float amount=analysis*.3+inspection*.24;
 vec3 mono=vec3(c)*vec3(.78,.88,.95);
 col=mix(col,mono,amount*.65);
 vec3 ink=mix(vec3(.2,.68,.79),vec3(.13,.29,.34),light);
 col=mix(col,col*.65+edge*ink,amount*band);
 float vignette=1.-.28*pow(length((uv-.5)*vec2(1.,.8)),1.4);
 col*=mix(.82,1.,light)*vignette;
 return col;
}
void main(){
 vec2 uv=vUv;
 float n=noise(uv*vec2(6.,10.));
 float front=mixValue*1.5-.25;
 float dissolve=smoothstep(front-.16,front+.16,uv.x*.5+uv.y*.16+n*.34);
 float weight=1.-dissolve;
 if(mixValue<=.001)weight=0.;if(mixValue>=.999)weight=1.;
 vec3 a=plate(imageA,aspectA,uv,1.-mixValue);
 vec3 b=plate(imageB,aspectB,uv,mixValue);
 vec3 col=mix(a,b,weight);
 float edgeFrame=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
 vec3 base=mix(vec3(.012,.02,.025),vec3(.94,.945,.93),light);
 col=mix(base,col,smoothstep(0.,.018,edgeFrame));
 gl_FragColor=vec4(col,1.);
}`;
// Geometry is a texture-derived relief, deliberately not presented as measured depth.
export const pointsVertex=`
precision highp float;
uniform sampler2D imageA;
uniform float aspect,aspectA,time,seed,pointOpacity,dpr;
uniform vec2 pointer;
attribute vec2 pixelUV;
varying vec3 vColor;
varying float vAlpha;
void main(){
 vec2 scale=aspect>aspectA?vec2(1.,aspectA/aspect):vec2(aspect/aspectA,1.);
 vec2 uv=(pixelUV-.5)*scale+.5;
 vec3 c=texture2D(imageA,uv).rgb;
 float l=dot(c,vec3(.2126,.7152,.0722));
 vec2 p=(pixelUV-.5)*2.;
 float band=exp(-pow((pixelUV.x-(sin(time*.14+seed)*.55+.5))*5.,2.));
 p+=(pointer-.5)*(l-.5)*.012;
 gl_Position=vec4(p,0.,1.);
 gl_PointSize=dpr*(.65+l*.6);
 vColor=mix(c,vec3(.58,.8,.84),.18);
 vAlpha=pointOpacity*band*pow(l,.7);
}`;
export const pointsFragment=`precision highp float;varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vColor,vAlpha*(1.-smoothstep(.3,1.,r)));}`;
