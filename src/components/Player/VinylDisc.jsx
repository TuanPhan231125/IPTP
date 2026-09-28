import React from 'react';
export default function VinylDisc({coverArt,isPlaying,settings={}}) {
 return <div className="turntable" style={{position:'relative'}}>
 <div className="vinyl" style={{animationDuration:(settings.spin||8)+'s',animationPlayState:isPlaying?'running':'paused'}}>
 <div className="vinyl-label">{coverArt&&<img src={coverArt} alt=""/>}<i/></div>
 </div>
 <div className="vinyl-reflection" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)', pointerEvents:'none'}}/>
 {settings.tonearm!==false&&<div className={'tonearm '+(isPlaying?'engaged':'')}/>}
 </div>;
}

