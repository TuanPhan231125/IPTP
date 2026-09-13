import {useState,useEffect,useRef} from 'react';
import {restoreConnection,request,connect,disconnect} from './api';
import {DEFAULT_COLLECTION} from '../utils/collection';
export default function useCloud(data,setData) {
 const [endpoint,setEndpoint]=useState(''),[status,setStatus]=useState('Chưa kết nối'),[busy,setBusy]=useState(false),[conflict,setConflict]=useState(null),[revision,setRevision]=useState(null),[features,setFeatures]=useState(null);
 const current=useRef(data),working=useRef(false),baseline=useRef(null);
 current.current=data;
 const saveBaseline=(value,rev,url=endpoint)=>{baseline.current=JSON.stringify(value);localStorage.setItem('tpug.sync.'+url,JSON.stringify({data:value,revision:rev}));setRevision(rev)};
 const load=async(url=endpoint)=>{
  if(working.current)return;working.current=true;setBusy(true);
  try{
   const remote=await request('/api/state');
   setFeatures(await request('/api/status'));
   let previous;try{previous=JSON.parse(localStorage.getItem('tpug.sync.'+url))}catch{}
   const local=JSON.stringify(current.current),server=JSON.stringify(remote.data);
   if(!remote.data){baseline.current=null;setRevision(remote.revision)}
   else if(local===server){saveBaseline(remote.data,remote.revision,url)}
   else if(local===JSON.stringify(DEFAULT_COLLECTION)||local===JSON.stringify(previous?.data)){
    saveBaseline(remote.data,remote.revision,url);setData(remote.data);
   }else{setConflict(remote);setRevision(null);setStatus('Có hai bản dữ liệu cần chọn');return}
   setStatus('Đã kết nối');
  }catch(e){setStatus(e.message)}finally{working.current=false;setBusy(false)}
 };
 useEffect(()=>{let live=true;restoreConnection().then(c=>{if(live&&c.endpoint){setEndpoint(c.endpoint);load(c.endpoint)}}).catch(e=>setStatus(e.message));return()=>{live=false}},[]);
 useEffect(()=>{
  if(!endpoint||revision===null||conflict||busy||JSON.stringify(data)===baseline.current)return;
  const timer=setTimeout(async()=>{
   if(working.current)return;working.current=true;setBusy(true);
   const snapshot=current.current;
   try{const saved=await request('/api/state',{method:'PUT',body:{revision,data:snapshot}});saveBaseline(snapshot,saved.revision);setStatus('Đã đồng bộ lúc '+new Date().toLocaleTimeString('vi-VN'))}
   catch(e){if(e.status===409){setConflict(e.remote);setRevision(null)}else setRevision(null);setStatus(e.message)}
   finally{working.current=false;setBusy(false)}
  },1500);return()=>clearTimeout(timer);
 },[data,endpoint,revision,conflict,busy]);
 return {endpoint,status,busy,conflict,features,refresh:()=>load(),
  connect:async(url,password)=>{setBusy(true);try{const c=await connect(url,password);setEndpoint(c.endpoint);setConflict(null);await load(c.endpoint)}catch(e){setStatus(e.message);throw e}finally{setBusy(false)}},
  disconnect:async()=>{await disconnect();setEndpoint('');setRevision(null);setConflict(null);setStatus('Đã ngắt kết nối')},
  resolve:choice=>{if(choice==='server'){setData(conflict.data);saveBaseline(conflict.data,conflict.revision)}else{baseline.current=null;setRevision(conflict.revision)}setConflict(null);setStatus('Đã chọn bản '+(choice==='server'?'server':'trên máy'))}
 };
}

