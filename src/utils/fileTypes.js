export const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.aac', '.flac', '.aiff', '.aif', '.caf', '.alac', '.ac3', '.eac3', '.ogg', '.opus', '.wma'];
export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.3gp', '.3g2', '.webm', '.mkv', '.avi'];

export const isAudioFile = (filename) => {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext));
};

export const isVideoFile = (filename) => {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
};

export const isMediaFile = (filename) => {
  return isAudioFile(filename) || isVideoFile(filename);
};
