import React,{useState} from 'react';
import {request} from './api';
import Icon from '../components/Icon';
import TrackRow from '../components/Library/TrackRow';
export default function Discover({data,setData,onPlay,onMore,connected,onSettings,currentSong}) {
 const [mode,setMode]=useState('mood'),[query,setQuery]=useState(''),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sample,setSample]=useState(false);
 const update=(key,value)=>setData(d=>({...d,profile:{...d.profile,[key]:value}}));
 return <div className="discover page-scroll"><p className="eyebrow">KHÁM PHÁ</p><h1>Hôm nay bạn muốn nghe gì?</h1>
 <details className="profile-card"><summary>Gu nhạc của bạn</summary><div className="form-stack">{[['genres','Thể loại / gu nhạc'],['languages','Ngôn ngữ'],['artists','Nghệ sĩ yêu thích']].map(([key,title])=><label key={key}>{title}<input value={data.profile[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div></details>
 {!connected&&<button className="soft-button" onClick={onSettings}><Icon name="cloud"/>Kết nối Railway để bắt đầu</button>}
 <div className="chips"><button className={mode==='mood'?'chosen':''} onClick={()=>{setMode('mood');setResults([])}}>Gemini theo tâm trạng</button><button className={mode==='search'?'chosen':''} onClick={()=>{setMode('search');setResults([])}}>Tìm YouTube</button></div>
 <form className="form-stack" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const response=await request(mode==='mood'?'/api/recommend':'/api/search',{method:'POST',body:mode==='mood'?{mood:query,profile:data.profile,sample:sample&&currentSong?{id:currentSong.id,title:currentSong.title,artist:currentSong.artist}:null}:{query}});setResults(response.items)}catch(e){setError(e.message)}finally{setBusy(false)}}}>
 <textarea rows="3" aria-label="Tâm trạng hoặc tên bài" placeholder={mode==='mood'?'Một buổi tối mưa, muốn nghe indie Việt nhẹ nhàng…':'Tên bài hoặc nghệ sĩ…'} value={query} maxLength={1000} onChange={e=>setQuery(e.target.value)}/>
 {mode==='mood'&&currentSong&&<label className="check"><input type="checkbox" checked={sample} onChange={e=>setSample(e.target.checked)}/>Dùng “{currentSong.title}” làm mẫu</label>}
 <button className="primary-button" disabled={busy||!connected||!query.trim()}>{busy?'Đang tìm nhạc…':mode==='mood'?'Gợi ý cho tôi':'Tìm video'}</button></form>
 {error&&<p className="inline-error" role="alert">{error}</p>}
 <div className="suggestions">{results.map((item,i)=>{const song=mode==='mood'?item.video:item;return <article className="suggestion" key={song?.id||i}>{song?<TrackRow song={song} onPlay={onPlay} onMore={onMore}/>:<h3>{item.title} · {item.artist}</h3>}{item.reason&&<p className="muted small">{item.reason}</p>}{item.warning&&<p className="muted small">{item.warning}</p>}</article>})}</div>
 <p className="muted small">Gợi ý dựa trên tên bài và gu nhạc, không phân tích file âm thanh. Video được phát qua YouTube; nội dung và khả năng phát phụ thuộc YouTube.</p>
 </div>;
}

