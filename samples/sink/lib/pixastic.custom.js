/*
 * Pixastic - JavaScript Image Processing Library
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * MIT License [http://www.pixastic.com/lib/license.txt]
 */


var Pixastic = exports.Pixastic=(function(){function addEvent(el,event,handler){if(el.addEventListener)
el.addEventListener(event,handler,false);else if(el.attachEvent)
el.attachEvent("on"+event,handler);}
function onready(handler){var handlerDone=false;var execHandler=function(){if(!handlerDone){handlerDone=true;handler();}}
document.write("<"+"script defer src=\"//:\" id=\"__onload_ie_pixastic__\"></"+"script>");var script=document.getElementById("__onload_ie_pixastic__");script.onreadystatechange=function(){if(script.readyState=="complete"){script.parentNode.removeChild(script);execHandler();}}
if(document.addEventListener)
document.addEventListener("DOMContentLoaded",execHandler,false);addEvent(window,"load",execHandler);}
function init(){var imgEls=getElementsByClass("pixastic",null,"img");var canvasEls=getElementsByClass("pixastic",null,"canvas");var elements=imgEls.concat(canvasEls);for(var i=0;i<elements.length;i++){(function(){var el=elements[i];var actions=[];var classes=el.className.split(" ");for(var c=0;c<classes.length;c++){var cls=classes[c];if(cls.substring(0,9)=="pixastic-"){var actionName=cls.substring(9);if(actionName!="")
actions.push(actionName);}}
if(actions.length){if(el.tagName.toLowerCase()=="img"){var dataImg=new Image();dataImg.src=el.src;if(dataImg.complete){for(var a=0;a<actions.length;a++){var res=Pixastic.applyAction(el,el,actions[a],null);if(res)
el=res;}}else{dataImg.onload=function(){for(var a=0;a<actions.length;a++){var res=Pixastic.applyAction(el,el,actions[a],null)
if(res)
el=res;}}}}else{setTimeout(function(){for(var a=0;a<actions.length;a++){var res=Pixastic.applyAction(el,el,actions[a],null);if(res)
el=res;}},1);}}})();}}
if(typeof pixastic_parseonload!="undefined"&&pixastic_parseonload)
onready(init);function getElementsByClass(searchClass,node,tag){var classElements=new Array();if(node==null)
node=document;if(tag==null)
tag='*';var els=node.getElementsByTagName(tag);var elsLen=els.length;var pattern=new RegExp("(^|\\s)"+searchClass+"(\\s|$)");for(i=0,j=0;i<elsLen;i++){if(pattern.test(els[i].className)){classElements[j]=els[i];j++;}}
return classElements;}
var debugElement;function writeDebug(text,level){if(!Pixastic.debug)return;try{switch(level){case"warn":console.warn("Pixastic:",text);break;case"error":console.error("Pixastic:",text);break;default:console.log("Pixastic:",text);}}catch(e){}
if(!debugElement){}}
var hasCanvas=(function(){var c=document.createElement("canvas");var val=false;try{val=!!((typeof c.getContext=="function")&&c.getContext("2d"));}catch(e){}
return function(){return val;}})();var hasCanvasImageData=(function(){var c=document.createElement("canvas");var val=false;var ctx;try{if(typeof c.getContext=="function"&&(ctx=c.getContext("2d"))){val=(typeof ctx.getImageData=="function");}}catch(e){}
return function(){return val;}})();var hasGlobalAlpha=(function(){var hasAlpha=false;var red=document.createElement("canvas");if(hasCanvas()&&hasCanvasImageData()){red.width=red.height=1;var redctx=red.getContext("2d");redctx.fillStyle="rgb(255,0,0)";redctx.fillRect(0,0,1,1);var blue=document.createElement("canvas");blue.width=blue.height=1;var bluectx=blue.getContext("2d");bluectx.fillStyle="rgb(0,0,255)";bluectx.fillRect(0,0,1,1);redctx.globalAlpha=0.5;redctx.drawImage(blue,0,0);var reddata=redctx.getImageData(0,0,1,1).data;hasAlpha=(reddata[2]!=255);}
return function(){return hasAlpha;}})();return{parseOnLoad:false,debug:false,applyAction:function(img,dataImg,actionName,options){options=options||{};var imageIsCanvas=(img.tagName.toLowerCase()=="canvas");if(imageIsCanvas&&Pixastic.Client.isIE()){if(Pixastic.debug)writeDebug("Tried to process a canvas element but browser is IE.");return false;}
var canvas,ctx;var hasOutputCanvas=false;if(Pixastic.Client.hasCanvas()){hasOutputCanvas=!!options.resultCanvas;canvas=options.resultCanvas||document.createElement("canvas");ctx=canvas.getContext("2d");}
var w=img.offsetWidth;var h=img.offsetHeight;if(imageIsCanvas){w=img.width;h=img.height;}
if(w==0||h==0){if(img.parentNode==null){var oldpos=img.style.position;var oldleft=img.style.left;img.style.position="absolute";img.style.left="-9999px";document.body.appendChild(img);w=img.offsetWidth;h=img.offsetHeight;document.body.removeChild(img);img.style.position=oldpos;img.style.left=oldleft;}else{if(Pixastic.debug)writeDebug("Image has 0 width and/or height.");return;}}
if(actionName.indexOf("(")>-1){var tmp=actionName;actionName=tmp.substr(0,tmp.indexOf("("));var arg=tmp.match(/\((.*?)\)/);if(arg[1]){arg=arg[1].split(";");for(var a=0;a<arg.length;a++){thisArg=arg[a].split("=");if(thisArg.length==2){if(thisArg[0]=="rect"){var rectVal=thisArg[1].split(",");options[thisArg[0]]={left:parseInt(rectVal[0],10)||0,top:parseInt(rectVal[1],10)||0,width:parseInt(rectVal[2],10)||0,height:parseInt(rectVal[3],10)||0}}else{options[thisArg[0]]=thisArg[1];}}}}}
if(!options.rect){options.rect={left:0,top:0,width:w,height:h};}else{options.rect.left=Math.round(options.rect.left);options.rect.top=Math.round(options.rect.top);options.rect.width=Math.round(options.rect.width);options.rect.height=Math.round(options.rect.height);}
var validAction=false;if(Pixastic.Actions[actionName]&&typeof Pixastic.Actions[actionName].process=="function"){validAction=true;}
if(!validAction){if(Pixastic.debug)writeDebug("Invalid action \""+actionName+"\". Maybe file not included?");return false;}
if(!Pixastic.Actions[actionName].checkSupport()){if(Pixastic.debug)writeDebug("Action \""+actionName+"\" not supported by this browser.");return false;}
if(Pixastic.Client.hasCanvas()){if(canvas!==img){canvas.width=w;canvas.height=h;}
if(!hasOutputCanvas){canvas.style.width=w+"px";canvas.style.height=h+"px";}
ctx.drawImage(dataImg,0,0,w,h);if(!img.__pixastic_org_image){canvas.__pixastic_org_image=img;canvas.__pixastic_org_width=w;canvas.__pixastic_org_height=h;}else{canvas.__pixastic_org_image=img.__pixastic_org_image;canvas.__pixastic_org_width=img.__pixastic_org_width;canvas.__pixastic_org_height=img.__pixastic_org_height;}}else if(Pixastic.Client.isIE()&&typeof img.__pixastic_org_style=="undefined"){img.__pixastic_org_style=img.style.cssText;}
var params={image:img,canvas:canvas,width:w,height:h,useData:true,options:options}
var res=Pixastic.Actions[actionName].process(params);if(!res){return false;}
if(Pixastic.Client.hasCanvas()){if(params.useData){if(Pixastic.Client.hasCanvasImageData()){canvas.getContext("2d").putImageData(params.canvasData,options.rect.left,options.rect.top);canvas.getContext("2d").fillRect(0,0,0,0);}}
if(!options.leaveDOM){canvas.title=img.title;canvas.imgsrc=img.imgsrc;if(!imageIsCanvas)canvas.alt=img.alt;if(!imageIsCanvas)canvas.imgsrc=img.src;canvas.className=img.className;canvas.style.cssText=img.style.cssText;canvas.name=img.name;canvas.tabIndex=img.tabIndex;canvas.id=img.id;if(img.parentNode&&img.parentNode.replaceChild){img.parentNode.replaceChild(canvas,img);}}
options.resultCanvas=canvas;return canvas;}
return img;},prepareData:function(params,getCopy){var ctx=params.canvas.getContext("2d");var rect=params.options.rect;var dataDesc=ctx.getImageData(rect.left,rect.top,rect.width,rect.height);var data=dataDesc.data;if(!getCopy)params.canvasData=dataDesc;return data;},process:function(img,actionName,options,callback){if(img.tagName.toLowerCase()=="img"){var dataImg=new Image();dataImg.src=img.src;if(dataImg.complete){var res=Pixastic.applyAction(img,dataImg,actionName,options);if(callback)callback(res);return res;}else{dataImg.onload=function(){var res=Pixastic.applyAction(img,dataImg,actionName,options)
if(callback)callback(res);}}}
if(img.tagName.toLowerCase()=="canvas"){var res=Pixastic.applyAction(img,img,actionName,options);if(callback)callback(res);return res;}},revert:function(img){if(Pixastic.Client.hasCanvas()){if(img.tagName.toLowerCase()=="canvas"&&img.__pixastic_org_image){img.width=img.__pixastic_org_width;img.height=img.__pixastic_org_height;img.getContext("2d").drawImage(img.__pixastic_org_image,0,0);if(img.parentNode&&img.parentNode.replaceChild){img.parentNode.replaceChild(img.__pixastic_org_image,img);}
return img;}}else if(Pixastic.Client.isIE()){if(typeof img.__pixastic_org_style!="undefined")
img.style.cssText=img.__pixastic_org_style;}},Client:{hasCanvas:hasCanvas,hasCanvasImageData:hasCanvasImageData,hasGlobalAlpha:hasGlobalAlpha,isIE:function(){return!!document.all&&!!window.attachEvent&&!window.opera;}},Actions:{}}})();Pixastic.Actions.blur={process:function(params){if(typeof params.options.fixMargin=="undefined")
params.options.fixMargin=true;if(Pixastic.Client.hasCanvasImageData()){var data=Pixastic.prepareData(params);var dataCopy=Pixastic.prepareData(params,true)
var kernel=[[0,1,0],[1,2,1],[0,1,0]];var weight=0;for(var i=0;i<3;i++){for(var j=0;j<3;j++){weight+=kernel[i][j];}}
weight=1/(weight*2);var rect=params.options.rect;var w=rect.width;var h=rect.height;var w4=w*4;var y=h;do{var offsetY=(y-1)*w4;var prevY=(y==1)?0:y-2;var nextY=(y==h)?y-1:y;var offsetYPrev=prevY*w*4;var offsetYNext=nextY*w*4;var x=w;do{var offset=offsetY+(x*4-4);var offsetPrev=offsetYPrev+((x==1)?0:x-2)*4;var offsetNext=offsetYNext+((x==w)?x-1:x)*4;data[offset]=((dataCopy[offsetPrev]
+dataCopy[offset-4]
+dataCopy[offset+4]
+dataCopy[offsetNext])*2
+dataCopy[offset]*4)*weight;data[offset+1]=((dataCopy[offsetPrev+1]
+dataCopy[offset-3]
+dataCopy[offset+5]
+dataCopy[offsetNext+1])*2
+dataCopy[offset+1]*4)*weight;data[offset+2]=((dataCopy[offsetPrev+2]
+dataCopy[offset-2]
+dataCopy[offset+6]
+dataCopy[offsetNext+2])*2
+dataCopy[offset+2]*4)*weight;}while(--x);}while(--y);return true;}else if(Pixastic.Client.isIE()){params.image.style.filter+=" progid:DXImageTransform.Microsoft.Blur(pixelradius=1.5)";if(params.options.fixMargin){params.image.style.marginLeft=(parseInt(params.image.style.marginLeft,10)||0)-2+"px";params.image.style.marginTop=(parseInt(params.image.style.marginTop,10)||0)-2+"px";}
return true;}},checkSupport:function(){return(Pixastic.Client.hasCanvasImageData()||Pixastic.Client.isIE());}}
Pixastic.Actions.coloradjust={process:function(params){var red=parseFloat(params.options.red)||0;var green=parseFloat(params.options.green)||0;var blue=parseFloat(params.options.blue)||0;red=Math.round(red*255);green=Math.round(green*255);blue=Math.round(blue*255);if(Pixastic.Client.hasCanvasImageData()){var data=Pixastic.prepareData(params);var rect=params.options.rect;var p=rect.width*rect.height;var pix=p*4,pix1,pix2;var r,g,b;while(p--){pix-=4;if(red){if((r=data[pix]+red)<0)
data[pix]=0;else if(r>255)
data[pix]=255;else
data[pix]=r;}
if(green){if((g=data[pix1=pix+1]+green)<0)
data[pix1]=0;else if(g>255)
data[pix1]=255;else
data[pix1]=g;}
if(blue){if((b=data[pix2=pix+2]+blue)<0)
data[pix2]=0;else if(b>255)
data[pix2]=255;else
data[pix2]=b;}}
return true;}},checkSupport:function(){return(Pixastic.Client.hasCanvasImageData());}}
Pixastic.Actions.sharpen={process:function(params){var strength=0;if(typeof params.options.amount!="undefined")
strength=parseFloat(params.options.amount)||0;if(strength<0)strength=0;if(strength>1)strength=1;if(Pixastic.Client.hasCanvasImageData()){var data=Pixastic.prepareData(params);var dataCopy=Pixastic.prepareData(params,true)
var mul=15;var mulOther=1+3*strength;var kernel=[[0,-mulOther,0],[-mulOther,mul,-mulOther],[0,-mulOther,0]];var weight=0;for(var i=0;i<3;i++){for(var j=0;j<3;j++){weight+=kernel[i][j];}}
weight=1/weight;var rect=params.options.rect;var w=rect.width;var h=rect.height;mul*=weight;mulOther*=weight;var w4=w*4;var y=h;do{var offsetY=(y-1)*w4;var nextY=(y==h)?y-1:y;var prevY=(y==1)?0:y-2;var offsetYPrev=prevY*w4;var offsetYNext=nextY*w4;var x=w;do{var offset=offsetY+(x*4-4);var offsetPrev=offsetYPrev+((x==1)?0:x-2)*4;var offsetNext=offsetYNext+((x==w)?x-1:x)*4;var r=((-dataCopy[offsetPrev]
-dataCopy[offset-4]
-dataCopy[offset+4]
-dataCopy[offsetNext])*mulOther
+dataCopy[offset]*mul);var g=((-dataCopy[offsetPrev+1]
-dataCopy[offset-3]
-dataCopy[offset+5]
-dataCopy[offsetNext+1])*mulOther
+dataCopy[offset+1]*mul);var b=((-dataCopy[offsetPrev+2]
-dataCopy[offset-2]
-dataCopy[offset+6]
-dataCopy[offsetNext+2])*mulOther
+dataCopy[offset+2]*mul);if(r<0)r=0;if(g<0)g=0;if(b<0)b=0;if(r>255)r=255;if(g>255)g=255;if(b>255)b=255;data[offset]=r;data[offset+1]=g;data[offset+2]=b;}while(--x);}while(--y);return true;}},checkSupport:function(){return Pixastic.Client.hasCanvasImageData();}}
