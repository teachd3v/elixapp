// Resize & JPEG-compress a File → base64 data URL, before we send it up to the
// server. Keeps DB rows sane (target ~40-100 KB per photo instead of raw MB).
export async function fileToCompressedDataUrl(file, { maxDim = 900, quality = 0.75 } = {}) {
  if (!file) return null;
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

// Rough size (in bytes) of a base64 data URL, for validation on the server.
export function dataUrlSize(s) {
  if (typeof s !== 'string') return 0;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}
