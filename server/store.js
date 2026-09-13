import pg from 'pg';
export class PostgresStore {
 constructor(url){this.pool=new pg.Pool({connectionString:url,max:3,connectionTimeoutMillis:10000})}
 async init(){await this.pool.query("CREATE TABLE IF NOT EXISTS tpug_state (id text PRIMARY KEY, revision integer NOT NULL, data jsonb NOT NULL)")}
 async read(){const {rows}=await this.pool.query("SELECT revision,data FROM tpug_state WHERE id='owner'");return rows[0]||{revision:0,data:null}}
 async write(revision,data){
  const result=await this.pool.query(`INSERT INTO tpug_state(id,revision,data) SELECT 'owner',1,$2::jsonb WHERE $1::integer=0 ON CONFLICT(id) DO UPDATE SET revision=tpug_state.revision+1,data=EXCLUDED.data WHERE tpug_state.revision=$1 RETURNING revision,data`,[revision,JSON.stringify(data)]);
  // INSERT SELECT above produces no row on updates. Use an explicit compare-and-swap for existing state.
  if(result.rows[0])return result.rows[0];
  if(revision>0){const update=await this.pool.query("UPDATE tpug_state SET revision=revision+1,data=$2::jsonb WHERE id='owner' AND revision=$1 RETURNING revision,data",[revision,JSON.stringify(data)]);if(update.rows[0])return update.rows[0]}
  return null;
 }
 async close(){await this.pool.end()}
}

