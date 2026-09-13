import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp,sanitizeCollection} from '../app.js';
const blank={playlists:[],favorites:[],hidden:[],history:[],profile:{genres:'Chill',artists:'',languages:'vi'},settings:{spin:8,tonearm:true,accent:'#8c7cf0',theme:'dark'},tags:{}};
async function start(t,env={}){
 let snapshot={revision:0,data:null};
 const store={async read(){return structuredClone(snapshot)},async write(revision,data){if(revision!==snapshot.revision)return null;snapshot={revision:revision+1,data};return structuredClone(snapshot)}};
 const server=createApp({store,env:{APP_PASSWORD:'test-only-password-not-for-deploy',...env},provider:{search:async()=>[{id:'yt:abcdefghijk',videoId:'abcdefghijk'}],recommend:async()=>[]}}).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 const request=async(path,method='GET',body,token)=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()}};
 const login=await request('/api/login','POST',{password:'test-only-password-not-for-deploy'});
 return {request,token:login.body.token};
}
test('private metadata and provider APIs require authentication; bad password rejected',async t=>{
 const {request}=await start(t);
 for(const path of ['/api/state','/api/status'])assert.equal((await request(path)).status,401);
 assert.equal((await request('/api/search','POST',{query:'test'})).status,401);
 assert.equal((await request('/api/login','POST',{password:'wrong'})).status,401);
 assert.equal((await request('/health')).body.app,'TPUGSOUND');
});
test('sync supports restore and rejects stale writes without losing data',async t=>{
 const {request,token}=await start(t);
 let r=await request('/api/state','PUT',{revision:0,data:blank},token);assert.equal(r.status,200);assert.equal(r.body.revision,1);
 r=await request('/api/state','PUT',{revision:0,data:{...blank,profile:{genres:'stale'}}},token);assert.equal(r.status,409);assert.equal(r.body.remote.data.profile.genres,'Chill');
 r=await request('/api/state','PUT',{revision:1,data:{...blank,tags:{a:'chill'}}},token);assert.equal(r.body.revision,2);
 assert.equal((await request('/api/state','GET',undefined,token)).body.data.tags.a,'chill');
});
test('sync whitelist never retains media bytes, absolute paths or API keys',()=>{
 const sanitized=sanitizeCollection({...blank,secret:'key',hidden:[{id:'abc',title:'Song',artist:'A',url:'/private/music/a.mp3',coverArt:'binary',source:'local',relativePath:'a.mp3',folderName:'Music'}]});
 assert.ok(!('secret' in sanitized));assert.ok(!('url' in sanitized.hidden[0]));assert.ok(!('coverArt' in sanitized.hidden[0]));
 assert.throws(()=>sanitizeCollection({...blank,playlists:'bad'}));
});
test('provider inputs validated and only authenticated users can request results',async t=>{
 const {request,token}=await start(t);
 assert.equal((await request('/api/search','POST',{query:''},token)).status,400);
 assert.equal((await request('/api/search','POST',{query:'music'},token)).body.items[0].videoId,'abcdefghijk');
 assert.equal((await request('/api/recommend','POST',{mood:'chill'},token)).status,200);
});
test('missing authentication configuration fails closed',async t=>{
 const {request}=await start(t,{APP_PASSWORD:''});
 assert.equal((await request('/api/login','POST',{password:''})).status,503);
});

