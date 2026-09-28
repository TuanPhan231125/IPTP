import React,{useRef} from 'react';
import VinylDisc from './VinylDisc';
import PlayerControls from './PlayerControls';
import Icon from '../Icon';
import {isPlayerDismissSwipe} from '../../utils/gestures';
export default function PlayerScreen(props) {
 const {currentSong,isPlaying,onBack,onQueue,onMore,favorite,onFavorite,settings,showVideo}=props;
 const touchStart=useRef(null);
 if(!currentSong)return null;
 const startSwipe=event=>{
  if(event.touches.length!==1||event.target.closest('button,input,select,textarea,a'))return;
  const touch=event.touches[0];touchStart.current={x:touch.clientX,y:touch.clientY};
 };
 const finishSwipe=event=>{
  const touch=event.changedTouches[0];
  if(isPlayerDismissSwipe(touchStart.current,{x:touch.clientX,y:touch.clientY},window.innerHeight))onBack();
  touchStart.current=null;
 };
 return <section className="player-screen" aria-label="Bài đang phát" onTouchStart={startSwipe} onTouchEnd={finishSwipe} onTouchCancel={()=>{touchStart.current=null}}>
 {currentSong.coverArt&&<div className="player-backdrop" style={{backgroundImage:`url(${currentSong.coverArt})`}}/>}
 <header className="player-header"><button className="icon-button" aria-label="Trở lại thư viện" onClick={onBack}><Icon name="down"/></button><p className="eyebrow">TPUGSOUND · ĐANG PHÁT</p><button className="icon-button" aria-label="Tùy chọn bài đang phát" onClick={()=>onMore(currentSong)}><Icon name="more"/></button></header>
 <div className="player-body"><VinylDisc coverArt={currentSong.coverArt} isPlaying={isPlaying} settings={settings}/>
 <div className="song-heading"><h2>{currentSong.title}</h2><p>{currentSong.artist}</p><p className="album-name">{currentSong.album}</p></div>
 <PlayerControls {...props}/>
 <div className="player-extras"><button className={'icon-button '+(favorite?'active':'')} aria-label="Yêu thích" aria-pressed={favorite} onClick={()=>onFavorite(currentSong)}><Icon name="heart" fill={favorite?'currentColor':'none'}/></button>
 {currentSong.type==='video'&&<button className="text-button" onClick={showVideo}><Icon name="video"/>Xem video</button>}
 <button className="text-button" onClick={onQueue}><Icon name="queue"/>Hàng đợi</button></div>
 {props.sleepRemaining>0&&<p className="muted small center">Tắt sau {Math.ceil(props.sleepRemaining/60)} phút</p>}
 </div></section>;
}

