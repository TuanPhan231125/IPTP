import {Capacitor,registerPlugin} from '@capacitor/core';
const bridge=registerPlugin('CloudBridge');
let connection={endpoint:'',token:''};
export async function restoreConnection(){
 if(Capacitor.isNativePlatform())connection=await bridge.getConnection();
 else {try{connection=JSON.parse(sessionStorage.getItem('tpug.connection'))||connection}catch{}}
 return connection;
}
export async function request(path,{method='GET',body,auth=true,endpoint=connection.endpoint,token=connection.token}={}){
 if(!endpoint)throw new Error('Káº¿t ná»‘i Railway trong CÃ i Ä‘áº·t trÆ°á»›c.');
 let response;
 try{response=await fetch(endpoint.replace(/\/$/,'')+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)})}
 catch{throw new Error('KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c server. Kiá»ƒm tra máº¡ng vÃ  Ä‘á»‹a chá»‰ Railway.')}
 const result=await response.json().catch(()=>({error:'Server tráº£ dá»¯ liá»‡u khÃ´ng há»£p lá»‡.'}));
 if(!response.ok)throw Object.assign(new Error(result.error||'Lá»—i server'),{status:response.status,remote:result.remote});
 return result;
}
export async function connect(endpoint,password){
 const url=new URL(endpoint.trim());if(url.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(url.hostname)&&!Capacitor.isNativePlatform()))throw new Error('Äá»‹a chá»‰ server pháº£i dÃ¹ng HTTPS.');
 if(url.username||url.password||url.search||url.hash)throw new Error('Chá»‰ nháº­p Ä‘á»‹a chá»‰ gá»‘c cá»§a server.');
 endpoint=url.origin;
 const {token}=await request('/api/login',{method:'POST',body:{password},auth:false,endpoint});
 const next={endpoint,token};
 if(Capacitor.isNativePlatform())await bridge.saveConnection(next);else sessionStorage.setItem('tpug.connection',JSON.stringify(next));
 connection=next;return next;
}
export async function disconnect(){
 if(Capacitor.isNativePlatform())await bridge.clearConnection();else sessionStorage.removeItem('tpug.connection');
 connection={endpoint:'',token:''};
}
export async function openYouTube(videoId){
 if(videoId&&!/^[\w-]{11}$/.test(videoId))throw new Error('Video ID khÃ´ng há»£p lá»‡.');
 if(Capacitor.isNativePlatform())return bridge.openYouTube(videoId?{videoId}:{});
 window.open(videoId?'https://m.youtube.com/watch?v='+videoId:'https://m.youtube.com/','_blank','noopener');
}
export function onYouTubeDismissed(listener){
 if(!Capacitor.isNativePlatform())return {remove(){}};
 return bridge.addListener('youtubeDismissed',listener);
}


export async function pauseYouTube(){
 if(Capacitor.isNativePlatform())return bridge.pauseYouTube();
}
