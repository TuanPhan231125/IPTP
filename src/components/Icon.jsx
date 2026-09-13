import React from 'react';
const paths = {
 play: <path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>,
 pause: <><path d="M7 5v14M17 5v14" strokeWidth="4"/></>,
 next: <><path d="m5 5 10 7-10 7Z" fill="currentColor" stroke="none"/><path d="M18 5v14" strokeWidth="3"/></>,
 previous: <><path d="m19 5-10 7 10 7Z" fill="currentColor" stroke="none"/><path d="M6 5v14" strokeWidth="3"/></>,
 shuffle: <><path d="m17 3 4 4-4 4M17 13l4 4-4 4M3 7h3c5 0 7 10 12 10h3M3 17h3c2 0 3-2 4-4M14 9c1-2 2-2 4-2h3"/></>,
 repeat: <><path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></>,
 down:<path d="m6 9 6 6 6-6"/>, up:<path d="m6 15 6-6 6 6"/>,
 close:<path d="m6 6 12 12M6 18 18 6"/>,
 folder:<path d="M3 7V5h6l2 2h10v13H3Z"/>,
 plus:<path d="M12 5v14M5 12h14"/>,
 music:<><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></>,
 video:<><rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/></>,
 queue:<><path d="M3 5h18M3 11h12M3 17h9"/><path d="m17 14 5 4-5 4Z" fill="currentColor" stroke="none"/></>,
 heart:<path d="M12 20 4 12C-2 5 7 0 12 7c5-7 14-2 8 5Z"/>,
 eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
 hidden:<><path d="m3 3 18 18M9 5c7-2 13 7 13 7l-3 4M6 6l-4 6s6 10 15 6"/></>,
 settings:<><path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="var(--bg-primary)"/><circle cx="16" cy="17" r="3" fill="var(--bg-primary)"/></>,
 sparkles:<><path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3ZM20 2v4M18 4h4"/></>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
 more:<><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
 cloud:<path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11ZM12 10v7m-3-3 3 3 3-3"/>,
};
export default function Icon({name,size=22,...props}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.music}</svg>;
}

