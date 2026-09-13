import React,{useState,useEffect,useMemo,useRef} from 'react';
import {Capacitor} from '@capacitor/core';
import useLibrary from './hooks/useLibrary';
import useAudioPlayer from './hooks/useAudioPlayer';
import useLocalStorage from './hooks/useLocalStorage';
import useCloud from './cloud/useCloud';
import CloudPanel from './cloud/CloudPanel';
import Discover from './cloud/Discover';
import {openYouTube} from './cloud/api';
import {DEFAULT_COLLECTION,trackRef,matches,resolveTrack,visibleTracks,moveItem} from './utils/collection';
import {filterAndSortSongs} from './utils/library';
import FolderPickerScreen from './components/FolderPicker/FolderPickerScreen';
import PlayerScreen from './components/Player/PlayerScreen';
import MiniPlayer from './components/Player/MiniPlayer';
import TrackRow from './components/Library/TrackRow';
import Sheet from './components/Sheet';
import Icon from './components/Icon';

export default function App(){
 const library=useLibrary(),player=useAudioPlayer();
 const [data,setData]=useLocalStorage('tpugsound.collection.v1',DEFAULT_COLLECTION);
 const cloud=useCloud(data,setData);
 const [tab,setTab]=useState('library'),[sheet,setSheet]=useState(null),[showPlayer,setShowPlayer]=useState(false),[picking,setPicking]=useState(false),[search,setSearch]=useState(''),[sort,setSort]=useState('title'),[folder,setFolder]=useState('all'),[kind,setKind]=useState('all'),[listID,setListID]=useState('favorites'),[name,setName]=useState(''),[notice,setNotice]=useState('');
 const visible=useMemo(()=>visibleTracks(library.songs,data.hidden),[library.songs,data.hidden]);
 const playable=useMemo(()=>visible.filter(s=>s.playable),[visible]);
 const lastHistory=useRef(null);
 const favorite=song=>data.favorites.some(ref=>matches(ref,song));
 const toggleFavorite=song=>setData(d=>({...d,favorites:d.favorites.some(ref=>matches(ref,song))?d.favorites.filter(ref=>!matches(ref,song)):[...d.favorites,trackRef(song)]}));
 const settings=value=>setData(d=>({...d,settings:{...d.settings,...value}}));
 const history=song=>{
  const ref=trackRef(song);
  setData(d=>({...d,history:[{id:crypto.randomUUID(),at:new Date().toISOString(),track:ref},...d.history].slice(0,200)}));
 };
 useEffect(()=>{if(!Capacitor.isNativePlatform()&&player.isPlaying&&player.currentSong&&lastHistory.current!==player.currentSong.id){lastHistory.current=player.currentSong.id;history(player.currentSong)}},[player.isPlaying,player.currentSong?.id]);
 useEffect(()=>{
  if(library.isLoading)return;
  const next=player.queue.map(old=>playable.find(s=>s.id===old.id)).filter(Boolean);
  if(player.currentSong&&!next.some(s=>s.id===player.currentSong.id)){player.stop();setShowPlayer(false)}
  else if(player.queue.length&&JSON.stringify(next)!==JSON.stringify(player.queue))player.updateQueue(next);
 },[playable,library.isLoading]);
 useEffect(()=>{document.documentElement.dataset.theme=data.settings.theme||'dark';document.documentElement.style.setProperty('--accent',data.settings.accent||'#8c7cf0')},[data.settings]);
 const play=async(song,queue=playable)=>{
  if(song.source==='youtube'){await player.pause();try{await openYouTube(song.videoId,!!data.settings.filterAds);history(song)}catch(e){setNotice(e.message)}return}
  if(song.playable===false){setNotice(song.playbackIssue);return}
  const next=queue.filter(s=>s.playable!==false&&s.source!=='youtube');
  player.setQueue(next.some(s=>s.id===song.id)?next:[song]);
  await player.playSong(song);setShowPlayer(true);
 };
 const pick=async()=>{setPicking(true);try{await library.pickFolder()}finally{setPicking(false)}};
 const hide=async song=>{
  if(player.currentSong?.id===song.id){await player.stop();setShowPlayer(false)}
  setData(d=>({...d,hidden:d.hidden.some(r=>matches(r,song))?d.hidden:[...d.hidden,trackRef(song)]}));
  setSheet(null);setNotice('Đã ẩn. Bạn có thể khôi phục trong Thư mục → Tệp đã ẩn.');
 };
 const enqueue=async(song,next=false)=>{
  if(!player.currentSong){await play(song,[song]);setSheet(null);return}
  const rest=player.queue.filter(s=>s.id!==song.id);
  if(song.id===player.currentSong.id){setNotice('Bài này đang phát.');return}
  const index=next?rest.findIndex(s=>s.id===player.currentSong.id)+1:rest.length;
  rest.splice(index,0,song);await player.updateQueue(rest);setSheet(null);setNotice(next?'Đã thêm để phát tiếp.':'Đã thêm vào cuối hàng đợi.');
 };
 useEffect(()=>{
  if(!player.nativeHistory.length)return;
  setData(d=>{
   const entries=new Map(d.history.map(h=>[h.id,h]));
   let changed=false;for(const h of player.nativeHistory)if(!entries.has(h.id)){entries.set(h.id,h);changed=true}
   if(!changed)return d;
   return {...d,history:[...entries.values()].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,200)};
  });
 },[player.nativeHistory]);
 const selectedList=data.playlists.find(p=>p.id===listID);
 const refs=listID==='favorites'?data.favorites:listID==='history'?data.history.map(h=>h.track):selectedList?.tracks||[];
 const listSongs=refs.map(r=>resolveTrack(r,visible));
 const filtered=filterAndSortSongs(visible.filter(s=>(folder==='all'||s.folderId===folder)&&(kind==='all'||s.type===kind)&&(!search||[s.title,s.artist,s.album,data.tags[s.id]||''].join(' ').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))),'',sort);
 const addToPlaylist=(id,song)=>{setData(d=>({...d,playlists:d.playlists.map(p=>p.id===id?{...p,tracks:p.tracks.some(r=>r.id===song.id)?p.tracks:[...p.tracks,trackRef(song)]}:p)}));setSheet(null);setNotice('Đã thêm vào playlist.')};
 const row=(song,i,queue=playable)=><TrackRow key={song.id+':'+i} song={song} active={player.currentSong?.id===song.id} onPlay={s=>play(s,queue)} onMore={s=>setSheet({type:'track',song:s})}/>;
 return <div className="app-container">
 <div className={'workspace '+(player.currentSong?'has-player':'')}>
 {tab==='library'&&(!library.folderSelected?<FolderPickerScreen onPickFolder={pick} error={library.error} isLoading={library.isLoading||picking} isDemo={library.isDemo}/>:<div className="library-content">
 <header className="library-header"><div><p className="eyebrow">TPUGSOUND</p><h1>Nhạc của bạn.</h1><p className="muted small">{visible.length} tệp · {library.folders.length} thư mục</p></div><div className="header-actions"><button className="icon-button" aria-label="Quét lại thư mục" disabled={library.isLoading||picking} onClick={library.refreshLibrary}><Icon name="repeat"/></button><button className="icon-button" aria-label="Quản lý thư mục" onClick={()=>setSheet({type:'folders'})}><Icon name="folder"/></button></div></header>
 <div className="library-filters"><input type="search" aria-label="Tìm bài, nghệ sĩ hoặc tag" placeholder="Tìm bài, nghệ sĩ, tag…" value={search} onChange={e=>setSearch(e.target.value)}/>
 <div className="filter-row"><select aria-label="Lọc thư mục" value={folder} onChange={e=>setFolder(e.target.value)}><option value="all">Tất cả thư mục</option>{library.folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><select aria-label="Sắp xếp thư viện" value={sort} onChange={e=>setSort(e.target.value)}><option value="title">Tên bài</option><option value="artist">Nghệ sĩ</option><option value="album">Album</option></select></div>
 <div className="chips">{[['all','Tất cả'],['audio','Âm thanh'],['video','Video']].map(([id,label])=><button key={id} className={kind===id?'chosen':''} onClick={()=>setKind(id)}>{label}</button>)}<button onClick={()=>setSheet({type:'hidden'})}><Icon name="hidden" size={16}/>{data.hidden.length} đã ẩn</button></div></div>
 {library.isDemo&&<p className="demo-banner">Xem thử bằng nhạc Internet. Chọn thư mục và video native có trong app iPhone.</p>}
 {library.error&&<p className="inline-error">{library.error}</p>}
 <div className="track-list">{library.isLoading?<p className="empty-state">Đang quét thư mục và metadata…</p>:filtered.length?filtered.map((s,i)=>row(s,i,filtered)):<p className="empty-state">Chưa có tệp phù hợp.</p>}</div>
 </div>)}
 {tab==='collection'&&<div className="page-scroll collection-page"><p className="eyebrow">BỘ SƯU TẬP</p><h1>Giữ lại điều bạn thích.</h1><div className="chips"><button className={listID==='favorites'?'chosen':''} onClick={()=>setListID('favorites')}>Yêu thích</button><button className={listID==='history'?'chosen':''} onClick={()=>setListID('history')}>Lịch sử</button>{data.playlists.map(p=><button key={p.id} className={listID===p.id?'chosen':''} onClick={()=>setListID(p.id)}>{p.name}</button>)}</div>
 <form className="inline-form" onSubmit={e=>{e.preventDefault();if(!name.trim())return;const id=crypto.randomUUID();setData(d=>({...d,playlists:[...d.playlists,{id,name:name.trim(),tracks:[]}]}));setName('');setListID(id)}}><input aria-label="Tên playlist mới" placeholder="Tạo playlist mới…" value={name} maxLength={100} onChange={e=>setName(e.target.value)}/><button className="icon-button" aria-label="Tạo playlist" disabled={!name.trim()}><Icon name="plus"/></button></form>
 {selectedList&&<div className="button-row"><button className="soft-button" onClick={()=>{setName(selectedList.name);setSheet({type:'rename',id:selectedList.id})}}>Đổi tên</button><button className="soft-button" onClick={()=>setSheet({type:'deletePlaylist',id:selectedList.id})}>Xóa playlist</button></div>}
 {listSongs.length?listSongs.map((s,i)=><div key={refs[i].id+':'+i}>{s?row(s,i,listSongs.filter(Boolean)):<p className="missing-track">{refs[i].title}<small>Đang ẩn hoặc chưa chọn lại thư mục chứa bài.</small></p>}{selectedList&&<div className="playlist-edit"><button className="icon-button" aria-label={'Đưa bài '+(i+1)+' lên'} disabled={i===0} onClick={()=>setData(d=>({...d,playlists:d.playlists.map(p=>p.id===listID?{...p,tracks:moveItem(p.tracks,i,i-1)}:p)}))}><Icon name="up" size={17}/></button><button className="icon-button" aria-label={'Đưa bài '+(i+1)+' xuống'} disabled={i===refs.length-1} onClick={()=>setData(d=>({...d,playlists:d.playlists.map(p=>p.id===listID?{...p,tracks:moveItem(p.tracks,i,i+1)}:p)}))}><Icon name="down" size={17}/></button><button className="text-button" onClick={()=>setData(d=>({...d,playlists:d.playlists.map(p=>p.id===listID?{...p,tracks:p.tracks.filter((_,index)=>index!==i)}:p)}))}>Bỏ khỏi playlist</button></div>}</div>):<p className="empty-state">Chọn dấu ba chấm cạnh một bài để thêm vào playlist hoặc yêu thích.</p>}
 </div>}
 {tab==='discover'&&<Discover data={data} setData={setData} onPlay={play} onMore={song=>setSheet({type:'track',song})} connected={!!cloud.endpoint} onSettings={()=>setTab('settings')} currentSong={player.currentSong}/>}
 {tab==='settings'&&<div className="page-scroll settings-page"><p className="eyebrow">TPUGSOUND</p><h1>Theo cách của bạn.</h1>
 <section className="settings-card form-stack"><h3>Đĩa than & giao diện</h3><label>Tốc độ xoay · {data.settings.spin} giây / vòng<input type="range" min="3" max="20" value={data.settings.spin} onChange={e=>settings({spin:Number(e.target.value)})}/></label><label className="check"><input type="checkbox" checked={data.settings.tonearm} onChange={e=>settings({tonearm:e.target.checked})}/>Hiện kim đĩa than</label><label>Giao diện<select value={data.settings.theme} onChange={e=>settings({theme:e.target.value})}><option value="dark">Tối</option><option value="light">Sáng</option></select></label><label>Màu chủ đạo<input type="color" value={data.settings.accent} onChange={e=>settings({accent:e.target.value})}/></label></section>
 <section className="settings-card form-stack"><h3>Thư viện & phát nhạc</h3><button className="soft-button" onClick={()=>setSheet({type:'folders'})}><Icon name="folder"/>Quản lý thư mục</button><button className="soft-button" onClick={()=>setSheet({type:'hidden'})}><Icon name="hidden"/>Tệp đã ẩn ({data.hidden.length})</button><label>Hẹn giờ tắt<select aria-label="Hẹn giờ tắt" defaultValue="0" onChange={e=>{player.setSleepTimer(Number(e.target.value));setNotice(e.target.value==='0'?'Đã hủy hẹn giờ.':'Đã đặt hẹn giờ '+e.target.value+' phút.')}} disabled={library.isDemo}><option value="0">Tắt hẹn giờ</option><option value="15">15 phút</option><option value="30">30 phút</option><option value="60">60 phút</option><option value="90">90 phút</option></select></label><p className="muted small">Mở video từ nút “Xem video” trong bài đang phát. Đóng video để trở về đĩa than, giữ nguyên vị trí nghe.</p></section>
 <section className="settings-card"><CloudPanel cloud={cloud}/></section>
 <section className="settings-card form-stack"><h3>YouTube</h3><label className="check"><input type="checkbox" checked={!!data.settings.filterAds} onChange={e=>settings({filterAds:e.target.checked})}/>Lọc một số nguồn quảng cáo bên ngoài</label><p className="muted small">Không đảm bảo bỏ quảng cáo trong video. Đăng nhập Google có thể cần Safari; phiên Safari và cửa sổ trong app không dùng chung đăng nhập. Nghe nền local hoạt động độc lập với YouTube.</p></section>
 <p className="muted small">TPUGSOUND · 1.1 · Giữ định danh bản cài VibePlayer.</p></div>}
 </div>
 {player.currentSong&&<MiniPlayer song={player.currentSong} isPlaying={player.isPlaying} onTogglePlay={player.togglePlay} onTap={()=>setShowPlayer(true)}/>}
 <nav className="bottom-nav" aria-label="Điều hướng chính">{[['library','music','Thư viện'],['collection','heart','Bộ sưu tập'],['discover','sparkles','Khám phá'],['settings','settings','Cài đặt']].map(([id,icon,label])=><button key={id} className={tab===id?'active':''} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
 {showPlayer&&player.currentSong&&<PlayerScreen {...player} settings={data.settings} favorite={favorite(player.currentSong)} onFavorite={toggleFavorite} onBack={()=>setShowPlayer(false)} onQueue={()=>setSheet({type:'queue'})} onMore={song=>setSheet({type:'track',song})}/>}
 {sheet&&<Sheet title={{folders:'Thư mục nhạc',hidden:'Tệp đã ẩn',track:sheet.song?.title,queue:'Hàng đợi',rename:'Đổi tên playlist',deletePlaylist:'Xóa playlist'}[sheet.type]} onClose={()=>setSheet(null)}>
 {sheet.type==='folders'&&<div className="form-stack"><p className="muted small">Đọc trực tiếp từ Tệp, gồm cả thư mục con. Gỡ thư mục khỏi app không xóa file gốc.</p>{library.folders.map(f=><div className="settings-card" key={f.id}><strong>{f.name}</strong>{f.error&&<p className="inline-error">{f.error}</p>}<button className="text-button" disabled={library.isLoading||picking} onClick={async()=>{if(player.currentSong?.folderId===f.id)await player.stop();await library.removeFolder(f.id);setFolder('all')}}>Gỡ khỏi thư viện</button></div>)}<button className="primary-button" disabled={picking||library.isLoading} onClick={pick}>{picking?'Đang chọn…':'Thêm thư mục'}</button><button className="soft-button" onClick={()=>setSheet({type:'hidden'})}>Quản lý tệp đã ẩn ({data.hidden.length})</button><p className="muted small">Nhận diện MP3, M4A, WAV, AAC, FLAC, ALAC, AIFF, CAF, AC3, MP4, MOV, M4V, 3GP, OGG, Opus, WebM, MKV, AVI, WMA. Khả năng phát phụ thuộc codec và iOS; tệp chưa hỗ trợ sẽ có lý do.</p></div>}
 {sheet.type==='hidden'&&<div className="form-stack"><p className="muted small">Tệp trong danh sách này vẫn bị ẩn sau khi quét lại hoặc mở lại app. Không xóa file trên iPhone.</p>{data.hidden.length?data.hidden.map(ref=><div className="hidden-row" key={ref.id}><span><strong>{ref.title}</strong><small>{ref.folderName} / {ref.relativePath}</small></span><button className="soft-button" onClick={()=>setData(d=>({...d,hidden:d.hidden.filter(r=>r.id!==ref.id)}))}>Hiện lại</button></div>):<p className="empty-state">Chưa ẩn tệp nào.</p>}</div>}
 {sheet.type==='track'&&<div className="form-stack">
 {sheet.song.source!=='youtube'&&<p className="muted small wrap">{sheet.song.folderName} / {sheet.song.relativePath}<br/>{sheet.song.playbackIssue}</p>}
 <button className="soft-button" onClick={()=>toggleFavorite(sheet.song)}><Icon name="heart"/>{favorite(sheet.song)?'Bỏ yêu thích':'Thêm yêu thích'}</button>
 {sheet.song.source!=='youtube'&&sheet.song.playable!==false&&<><button className="soft-button" onClick={()=>enqueue(sheet.song,true)}><Icon name="next"/>Phát tiếp theo</button><button className="soft-button" onClick={()=>enqueue(sheet.song)}><Icon name="queue"/>Thêm cuối hàng đợi</button></>}
 <label>Thêm vào playlist<select value="" onChange={e=>addToPlaylist(e.target.value,sheet.song)}><option value="" disabled>Chọn playlist…</option>{data.playlists.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{!data.playlists.length&&<p className="muted small">Tạo playlist trong tab Bộ sưu tập.</p>}
 <label>Tag cá nhân<input placeholder="chill, tập luyện…" value={data.tags[sheet.song.id]||''} maxLength={200} onChange={e=>{const value=e.target.value;setData(d=>({...d,tags:{...d.tags,[sheet.song.id]:value}}))}}/></label>
 {sheet.song.source!=='youtube'&&<button className="soft-button" onClick={()=>hide(sheet.song)}><Icon name="hidden"/>Ẩn khỏi thư viện</button>}</div>}
 {sheet.type==='queue'&&<><p className="muted small">Thay đổi thứ tự bên dưới không làm mất vị trí bài đang phát.</p>{player.queue.map((s,i)=><div key={s.id}>{row(s,i,player.queue)}<div className="playlist-edit"><button className="icon-button" aria-label={'Đưa '+s.title+' lên'} disabled={i===0} onClick={()=>player.updateQueue(moveItem(player.queue,i,i-1))}><Icon name="up"/></button><button className="icon-button" aria-label={'Đưa '+s.title+' xuống'} disabled={i===player.queue.length-1} onClick={()=>player.updateQueue(moveItem(player.queue,i,i+1))}><Icon name="down"/></button><button className="text-button" disabled={s.id===player.currentSong?.id} onClick={()=>player.updateQueue(player.queue.filter(t=>t.id!==s.id))}>Bỏ khỏi hàng đợi</button></div></div>)}</>}
 {sheet.type==='rename'&&<form className="form-stack" onSubmit={e=>{e.preventDefault();if(!name.trim())return;setData(d=>({...d,playlists:d.playlists.map(p=>p.id===sheet.id?{...p,name:name.trim()}:p)}));setName('');setSheet(null)}}><input aria-label="Tên playlist" value={name} onChange={e=>setName(e.target.value)} maxLength={100}/><button className="primary-button">Lưu</button></form>}
 {sheet.type==='deletePlaylist'&&<div className="form-stack"><p>Xóa danh sách bài này khỏi bộ sưu tập. File nhạc vẫn ở nguyên trên iPhone.</p><button className="primary-button" onClick={()=>{setData(d=>({...d,playlists:d.playlists.filter(p=>p.id!==sheet.id)}));setListID('favorites');setSheet(null)}}>Xóa playlist này</button></div>}
 </Sheet>}
 {(notice||player.error)&&<div className="error-toast" role="status"><span>{notice||player.error}</span><button className="icon-button" aria-label="Đóng thông báo" onClick={()=>{setNotice('');player.dismissError()}}><Icon name="close"/></button></div>}
 </div>;
}


