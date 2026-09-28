import React from 'react';
export default function VinylDisc({coverArt,isPlaying,settings={}}) {
 return <div className="turntable">
 <div className="vinyl" style={{animationDuration:(settings.spin||8)+'s',animationPlayState:isPlaying?'running':'paused'}}>
 <div className="vinyl-label">{coverArt&&<img src={coverArt} alt=""/>}<i/></div>
 </div>{settings.tonearm!==false&&<div className={'tonearm '+(isPlaying?'engaged':'')}/>}
 </div>;
}

