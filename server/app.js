import express from 'express';
import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(String(s)).digest();
const equal=(a,b)=>timingSafeEqual(hash(a),hash(b));
const failure=(message,status=400)=>Object.assign(new Error(message),{status});
const text=(v,max=500)=>typeof v==='string'?v.slice(0,max):'';
function ref(v){
 if(!v||typeof v.id!=='string'||typeof v.title!=='string')throw failure('Tham chiếu bài không hợp lệ.');
 if(v.source==='youtube'){if(!/^[\w-]{11}$/.test(v.videoId))throw failure('Video ID không hợp lệ.');return {id:'yt:'+v.videoId,source:'youtube',videoId:v.videoId,title:text(v.title),artist:text(v.artist)}}
 return {id:text(v.id,2000),source:'local',title:text(v.title),artist:text(v.artist),folderName:text(v.folderName),relativePath:text(v.relativePath,1500),size:Math.max(0,Number(v.size)||0)};
}
export function sanitizeCollection(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw failure('Dữ liệu đồng bộ không hợp lệ.');
 const list=(v,max,fn)=>{if(!Array.isArray(v)||v.length>max)throw failure('Danh sách không hợp lệ hoặc quá lớn.');return v.map(fn)};
 return {playlists:list(value.playlists,200,p=>({id:text(p.id,100),name:text(p.name,100),tracks:list(p.tracks,3000,ref)})),
 favorites:list(value.favorites,5000,ref),hidden:list(value.hidden,5000,ref),
 history:list(value.history,200,h=>({id:text(h.id,100),at:text(h.at,40),track:ref(h.track)})),
 profile:{genres:text(value.profile?.genres),languages:text(value.profile?.languages),artists:text(value.profile?.artists)},
 settings:{spin:Math.min(30,Math.max(3,Number(value.settings?.spin)||8)),tonearm:value.settings?.tonearm!==false,accent:/^#[a-fA-F0-9]{6}$/.test(value.settings?.accent)?value.settings.accent:'#8c7cf0',theme:value.settings?.theme==='light'?'light':'dark',filterAds:!!value.settings?.filterAds},
 tags:Object.fromEntries(Object.entries(value.tags||{}).slice(0,5000).map(([id,tags])=>[id.slice(0,2000),text(tags,200)]))};
}
export function createApp({store,env,provider,now=Date.now}){
 const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
 app.use((req,res,next)=>{res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});const origin=req.get('Origin');if(origin&&(origin==='capacitor://localhost'||origin===env.CLIENT_ORIGIN||(!env.NODE_ENV?.includes('production')&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)))){res.set({'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,PUT,POST,OPTIONS'});}if(req.method==='OPTIONS')return res.sendStatus(204);next()});
 app.use(express.json({limit:'2mb'}));
 const signature=value=>createHmac('sha256',env.APP_PASSWORD||'disabled').update(value).digest('base64url');
 const valid=token=>{if(!env.APP_PASSWORD||typeof token!=='string')return false;const [time,sig]=token.split('.');return /^\d+$/.test(time)&&Number(time)>now()&&Number(time)<now()+31*86400000&&equal(sig,signature(time))};
 const limits=new Map();
 const limit=(name,max,ms)=>(req,res,next)=>{const key=name+':'+req.ip;const bucket=limits.get(key)||{count:0,until:now()+ms};if(bucket.until<=now()){bucket.count=0;bucket.until=now()+ms}bucket.count++;limits.set(key,bucket);if(limits.size>3000){for(const [key,value] of limits)if(value.until<=now())limits.delete(key)}if(bucket.count>max){res.set('Retry-After',String(Math.ceil((bucket.until-now())/1000)));return res.status(429).json({error:'Thao tác quá nhanh. Vui lòng chờ rồi thử lại.'})}next()};
 app.get('/health',(_req,res)=>res.json({app:'TPUGSOUND',apiVersion:1}));
 app.get('/',(_req,res)=>res.type('text').send('TPUGSOUND backend. Kết nối bằng ứng dụng để đồng bộ và gợi ý nhạc.'));
 app.post('/api/login',limit('login',10,15*60000),(req,res)=>{
  if(!env.APP_PASSWORD||env.APP_PASSWORD.length<16)return res.status(503).json({error:'Railway cần APP_PASSWORD ít nhất 16 ký tự.'});
  if(!equal(req.body?.password,env.APP_PASSWORD))return res.status(401).json({error:'Mật khẩu kết nối chưa đúng.'});
  const time=String(now()+30*86400000);res.json({token:time+'.'+signature(time)});
 });
 app.use('/api',(req,res,next)=>valid(req.get('Authorization')?.replace(/^Bearer /,''))?next():res.status(401).json({error:'Hãy kết nối lại server trong Cài đặt.'}));
 app.get('/api/status',async(_req,res)=>{let database=false;try{await store.read();database=true}catch{}res.json({database,gemini:!!env.GEMINI_API_KEY,youtube:!!env.YOUTUBE_API_KEY})});
 app.get('/api/state',async(_req,res)=>res.json(await store.read()));
 app.put('/api/state',async(req,res)=>{
  if(!Number.isSafeInteger(req.body?.revision)||req.body.revision<0)throw failure('Phiên bản dữ liệu không hợp lệ.');
  const data=sanitizeCollection(req.body.data);const saved=await store.write(req.body.revision,data);
  if(!saved)return res.status(409).json({error:'Server có dữ liệu mới hơn. Chọn giữ bản trên máy hoặc tải bản server.',remote:await store.read()});
  res.json(saved);
 });
 app.post('/api/search',limit('search',20,60000),async(req,res)=>{const query=text(req.body?.query,200).trim();if(!query)throw failure('Nhập tên bài cần tìm.');res.json({items:await provider.search(query)})});
 app.post('/api/recommend',limit('ai',5,60000),async(req,res)=>{const mood=text(req.body?.mood,1000).trim();if(!mood)throw failure('Nhập tâm trạng của bạn.');const p=req.body?.profile||{};res.json({items:await provider.recommend({mood,profile:{genres:text(p.genres),languages:text(p.languages),artists:text(p.artists)},sample:req.body?.sample?ref(req.body.sample):null})})});
 app.use((err,_req,res,_next)=>{const status=err.status||503;res.status(status).json({error:err.status?err.message:'Server hoặc cơ sở dữ liệu chưa sẵn sàng. Kiểm tra cấu hình Railway.'})});
 return app;
}

