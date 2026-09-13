import React from 'react';
import Icon from '../Icon';
export default function MiniPlayer({song,isPlaying,onTogglePlay,onTap}) {
 return <div className="mini-player">
  <button className="mini-track" onClick={onTap} aria-label={'Mở bài đang phát: '+song.title}>
   <span className="cover">{song.coverArt?<img src={song.coverArt} alt=""/>:<Icon name={song.type==='video'?'video':'music'}/>}</span>
   <span className="track-copy"><strong>{song.title}</strong><small>{song.artist}</small></span>
  </button>
  <button className="icon-button" aria-label={isPlaying?'Tạm dừng':'Phát nhạc'} onClick={onTogglePlay}><Icon name={isPlaying?'pause':'play'}/></button>
 </div>;
}

