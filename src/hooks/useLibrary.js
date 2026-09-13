import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { normalizeSongs } from '../utils/library.js';
const FolderPicker = registerPlugin('FolderPicker');
const native = Capacitor.isNativePlatform();
const DEMO = [1,2,3].map(n => ({id:'demo-'+n, path:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-'+n+'.mp3', title:'SoundHelix Song '+n, artist:'SoundHelix', album:'Nhạc mẫu', folderId:'demo', folderName:'Nhạc mẫu', type:'audio', extension:'mp3', playable:true}));
export default function useLibrary() {
 const [songs,setSongs]=useState([]);
 const [folders,setFolders]=useState([]);
 const [isLoading,setLoading]=useState(true);
 const [error,setError]=useState(null);
 const alive=useRef(false), pending=useRef(null);
 const scan=useCallback(async()=> {
  if(pending.current) return pending.current;
  setLoading(true); setError(null);
  const task=(async()=>{try {
   const result=native?await FolderPicker.scanFolder():{files:DEMO,folders:[{id:'demo',name:'Nhạc mẫu trực tuyến'}]};
   if(!alive.current) return false;
   setSongs(normalizeSongs(result.files||[])); setFolders(result.folders||[]);
   const failures=(result.folders||[]).filter(f=>f.error);
   if(failures.length) setError(failures.map(f=>f.name+': '+f.error).join('\n'));
   return true;
  }catch(e){if(alive.current)setError(e.message);return false}
  finally{if(alive.current)setLoading(false)}})();
  pending.current=task;
  try{return await task}finally{pending.current=null}
 },[]);
 useEffect(()=>{alive.current=true;if(native)scan();else setLoading(false);return()=>{alive.current=false}},[scan]);
 const pickFolder=useCallback(async()=>{
  if(pending.current)return false;
  try{if(native)await FolderPicker.pickFolder();return await scan()}
  catch(e){if(e.code!=='CANCELLED')setError(e.message);return false}
 },[scan]);
 const removeFolder=useCallback(async id=>{
  if(pending.current)return false;
  if(native)await FolderPicker.clearBookmark({folderId:id});
  else {setFolders([]);setSongs([]);return true}
  return scan();
 },[scan]);
 return {songs,folders,folderSelected:folders.length>0,folderPath:folders.map(f=>f.name).join(', '),isLoading,error,isDemo:!native,pickFolder,removeFolder,refreshLibrary:scan};
}

