import test from 'node:test';
import assert from 'node:assert/strict';
import {trackRef,visibleTracks,resolveTrack,moveItem,DEFAULT_COLLECTION} from '../src/utils/collection.js';
import {normalizeSongs} from '../src/utils/library.js';
import {createPlayerController} from '../src/player/controller.js';

test('hidden media survives rescan and re-link, without hiding a namesake',()=>{
 const song={id:'f1:sub/a.flac',folderName:'Music',relativePath:'sub/a.flac',size:900,title:'A',artist:'B'};
 const hidden=[trackRef(song)];
 const restored={...song,id:'new:sub/a.flac'};
 assert.deepEqual(visibleTracks([restored,{...song,id:'other',folderName:'Recordings'}],JSON.parse(JSON.stringify(hidden))).map(s=>s.folderName),['Recordings']);
 assert.equal(visibleTracks([restored],[]).length,1);
 assert.equal(resolveTrack(trackRef(song),[restored]),restored);
 assert.ok(!('url' in trackRef({...song,url:'/private/local/path'})));
});
test('format normalization preserves unsupported media and native metadata',()=>{
 const [song]=normalizeSongs([{path:'/v/movie.mkv',id:'f:movie',type:'video',playable:false,playbackIssue:'Codec',folderId:'f'}]);
 assert.equal(song.type,'video');assert.equal(song.playable,false);assert.equal(song.playbackIssue,'Codec');assert.equal(song.folderId,'f');
});
test('queue editing keeps position and never replaces current audio source',async()=>{
 let source='',plays=0;
 const audio={paused:true,currentTime:12,duration:100,addEventListener(){},removeEventListener(){},set src(v){source=v},get src(){return source},async play(){this.paused=false;plays++},pause(){this.paused=true},removeAttribute(){},load(){}};
 const songs=normalizeSongs([{id:'a',path:'/a.mp3'},{id:'b',path:'/b.mp3'},{id:'c',path:'/c.mp3'}]);
 const p=createPlayerController({audioFactory:()=>audio,onState(){}});await p.ready;p.setQueue(songs);await p.playSong(songs[0]);
 await p.updateQueue(moveItem(songs,2,1));assert.equal(source,'/a.mp3');assert.equal(plays,1);assert.equal(audio.currentTime,12);
 await p.next();assert.equal(source,'/c.mp3');
 p.dispose();
});
test('native queue editing sends updateQueue instead of restarting playback',async()=>{
 const calls=[];const native={async addListener(){return {remove(){}}},async getState(){return {songId:'a',currentTime:42,isPlaying:true}},async updateQueue(args){calls.push(args)}};
 const p=createPlayerController({native,onState(){}});await p.ready;const songs=[{id:'a',url:'/a'},{id:'b',url:'/b'}];p.setQueue(songs);
 await p.updateQueue([...songs].reverse());assert.equal(p.getState().currentTime,42);assert.equal(calls.length,1);assert.equal(calls[0].songs[0].id,'b');p.dispose();
});

