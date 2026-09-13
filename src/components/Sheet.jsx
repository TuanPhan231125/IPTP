import React,{useEffect,useRef} from 'react';
import Icon from './Icon';
export default function Sheet({title,onClose,children}) {
 const ref=useRef(null);
 useEffect(()=>{const previous=document.activeElement;ref.current?.focus();const handler=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const nodes=[...ref.current.querySelectorAll('button:not(:disabled),input,select,textarea,a[href]')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);previous?.focus()}},[]);
 return <div className="sheet-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><section className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}><header><h2>{title}</h2><button className="icon-button" aria-label="Đóng" onClick={onClose}><Icon name="close"/></button></header><div className="sheet-body">{children}</div></section></div>;
}

