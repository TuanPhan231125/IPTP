import React,{useState} from 'react';
export default function CloudPanel({cloud}) {
 const [url,setUrl]=useState(cloud.endpoint),[password,setPassword]=useState(''),[error,setError]=useState('');
 return <div className="form-stack"><h3>Đồng bộ Railway</h3><p className="muted small">Chỉ đồng bộ playlist, yêu thích, danh sách ẩn, gu nhạc, lịch sử và cài đặt. File nhạc/video ở nguyên trên iPhone.</p>
 {!cloud.endpoint?<form className="form-stack" onSubmit={async e=>{e.preventDefault();setError('');try{await cloud.connect(url,password);setPassword('')}catch(e){setError(e.message)}}}>
 <label>Địa chỉ server<input type="url" required placeholder="https://…up.railway.app" value={url} onChange={e=>setUrl(e.target.value)}/></label>
 <label>Mật khẩu kết nối<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
 <button className="primary-button" disabled={cloud.busy}>Kết nối</button></form>:<><p className="muted small wrap">{cloud.endpoint}</p><div className="button-row"><button className="soft-button" disabled={cloud.busy} onClick={cloud.refresh}>Đồng bộ ngay</button><button className="soft-button" disabled={cloud.busy} onClick={cloud.disconnect}>Ngắt kết nối</button></div></>}
 <p role="status" className="muted small">{cloud.busy?'Đang kết nối / đồng bộ…':cloud.status}</p>
 {cloud.features&&<p className="muted small">Database: {cloud.features.database?'sẵn sàng':'chưa kết nối'} · Gemini: {cloud.features.gemini?'có key':'thiếu key'} · YouTube: {cloud.features.youtube?'có key':'thiếu key'}</p>}
 {error&&<p className="inline-error">{error}</p>}
 {cloud.conflict&&<div className="form-stack"><p>Có dữ liệu khác nhau. Chọn bản muốn giữ; bản hiện tại vẫn ở trên máy cho đến khi bạn chọn.</p><button className="soft-button" onClick={()=>cloud.resolve('server')}>Dùng bản server</button><button className="soft-button" onClick={()=>cloud.resolve('local')}>Dùng bản trên máy</button></div>}
 </div>;
}

