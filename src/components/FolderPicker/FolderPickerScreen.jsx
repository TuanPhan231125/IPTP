import React from 'react';

export default function FolderPickerScreen({ onPickFolder, error, isLoading, isDemo }) {
  return (
    <div className="folder-screen">
      <div className="welcome-disc" aria-hidden="true">♫</div>
      <p className="eyebrow">NHẠC CỦA RIÊNG BẠN</p>
      <h1>VibePlayer</h1>
      <p className="muted">Chọn thư mục để nghe nhạc với chiếc đĩa than của bạn.</p>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={isLoading} onClick={onPickFolder}>
        {isLoading ? 'Đang mở thư viện…' : isDemo ? 'Nghe thử nhạc mẫu' : 'Chọn thư mục nhạc'}
      </button>
      <p className="muted small">
        {isDemo
          ? 'Bản xem thử trên trình duyệt dùng nhạc mẫu Internet. Chọn thư mục thật và nghe khi khóa máy có trong ứng dụng iPhone.'
          : 'Chọn trong Tệp → Trên iPhone. Nhạc được đọc từ thư mục gốc, gồm cả thư mục con.'}
      </p>
      <p className="muted small">MP3 · M4A · WAV · AAC</p>
    </div>
  );
}