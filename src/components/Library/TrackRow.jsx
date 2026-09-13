import React from 'react';
import Icon from '../Icon';
import {formatTime} from '../../utils/formatTime';
export default function TrackRow({song,active,onPlay,onMore,detail}) {
 return <div className={'track-row '+(active?'selected':'')}>
 <button className="track-main" onClick={()=>onPlay(song)} disabled={song.playable===false}>
 <span className="cover">{song.coverArt?<img src={song.coverArt} alt=""/>:<Icon name={song.type==='video'||song.source==='youtube'?'video':'music'}/>}</span>
 <span className="track-copy"><strong>{song.title}</strong><small>{detail||song.playbackIssue||song.artist}</small></span>
 <span className="track-duration">{song.extension?.toUpperCase()}<small>{song.duration?formatTime(song.duration):''}</small></span>
 </button>{onMore&&<button className="icon-button" aria-label={'Tùy chọn '+song.title} onClick={()=>onMore(song)}><Icon name="more"/></button>}
 </div>;
}

