export const DEFAULT_COLLECTION = {playlists:[],favorites:[],hidden:[],history:[],profile:{genres:'',languages:'Tiếng Việt',artists:''},settings:{spin:8,tonearm:true,accent:'#8c7cf0',theme:'dark'},tags:{}};
export function trackRef(song) {
 if(song.source==='youtube') return {id:song.id,source:'youtube',videoId:song.videoId,title:song.title,artist:song.artist||''};
 return {id:song.id,source:'local',title:song.title,artist:song.artist,folderName:song.folderName||'',relativePath:song.relativePath||'',size:song.size||0};
}
export function matches(ref,song) {
 return ref.id===song.id || (!!ref.relativePath && ref.folderName===song.folderName && ref.relativePath===song.relativePath && ref.size===song.size);
}
export function resolveTrack(ref,songs) {return ref.source==='youtube'?ref:songs.find(s=>matches(ref,s))}
export function visibleTracks(songs,hidden) {return songs.filter(s=>!hidden.some(h=>matches(h,s)))}
export function moveItem(items,from,to) {if(from<0||to<0||from>=items.length||to>=items.length)return items;const copy=[...items];copy.splice(to,0,copy.splice(from,1)[0]);return copy}

