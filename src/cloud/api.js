import {Capacitor,registerPlugin} from '@capacitor/core';
const bridge=registerPlugin('CloudBridge');
let connection={endpoint:'',token:''};
export async function restoreConnection(){
 if(Capacitor.isNativePlatform())connection=await bridge.getConnection();
 else {try{connection=JSON.parse(sessionStorage.getItem('tpug.connection'))||connection}catch{}}
 return connection;
}
export async function request(path,{method='GET',body,auth=true,endpoint=connection.endpoint,token=connection.token}={}){
 if(!endpoint)throw new Error('Kết nối Railway trong Cài đặt trước.');
 let response;
 try{response=await fetch(endpoint.replace(/\/$/,'')+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)})}
 catch{throw new Error('Không kết nối được server. Kiểm tra mạng và địa chỉ Railway.')}
 const result=await response.json().catch(()=>({error:'Server trả dữ liệu không hợp lệ.'}));
 if(!response.ok)throw Object.assign(new Error(result.error||'Lỗi server'),{status:response.status,remote:result.remote});
 return result;
}
export async function connect(endpoint,password){
 const url=new URL(endpoint.trim());if(url.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(url.hostname)&&!Capacitor.isNativePlatform()))throw new Error('Địa chỉ server phải dùng HTTPS.');
 if(url.username||url.password||url.search||url.hash)throw new Error('Chỉ nhập địa chỉ gốc của server.');
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
export async function openYouTube(videoId,filterAds=false){
 if(!/^[\w-]{11}$/.test(videoId))throw new Error('Video ID không hợp lệ.');
 if(Capacitor.isNativePlatform())return bridge.openYouTube({videoId,filterAds});
 window.open('https://www.youtube.com/watch?v='+videoId,'_blank','noopener');
}

