import {createApp} from './app.js';
import {PostgresStore} from './store.js';
import {providers} from './providers.js';
const env=process.env;
const unavailable={read:async()=>{throw new Error('DATABASE_URL is missing')},write:async()=>{throw new Error('DATABASE_URL is missing')}};
const store=env.DATABASE_URL?new PostgresStore(env.DATABASE_URL):unavailable;
if(store.init){let initialized=false;for(let attempt=0;attempt<6;attempt++){try{await store.init();initialized=true;break}catch{console.error('Database not ready; retrying schema initialization.');await new Promise(r=>setTimeout(r,5000))}}if(!initialized)process.exit(1)}
const server=createApp({store,env,provider:providers(env)}).listen(Number(env.PORT)||3000,'0.0.0.0',()=>console.log('TPUGSOUND API listening'));
process.on('SIGTERM',()=>server.close(async()=>{await store.close?.();process.exit(0)}));

