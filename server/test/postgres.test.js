import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {PostgresStore} from '../store.js';
test('Postgres compare-and-swap is atomic and state persists after reconnect',{skip:!process.env.TPUG_TEST_DATABASE_URL},async()=>{
 const url=process.env.TPUG_TEST_DATABASE_URL;
 const admin=new pg.Pool({connectionString:url});
 const schema='tpug_test_'+Date.now();
 await admin.query('CREATE SCHEMA '+schema);
 const scoped=new URL(url);scoped.searchParams.set('options','-c search_path='+schema);
 let store=new PostgresStore(scoped.toString());
 try{
  await store.init();assert.equal((await store.read()).revision,0);
  const first=await store.write(0,{value:'first'});assert.equal(first.revision,1);
  const races=await Promise.all([store.write(1,{value:'a'}),store.write(1,{value:'b'})]);
  assert.equal(races.filter(Boolean).length,1);
  assert.equal(await store.write(0,{value:'stale'}),null);
  await store.close();store=new PostgresStore(scoped.toString());
  const restored=await store.read();assert.equal(restored.revision,2);assert.ok(['a','b'].includes(restored.data.value));
 }finally{await store.close();await admin.query('DROP SCHEMA '+schema+' CASCADE');await admin.end()}
});

