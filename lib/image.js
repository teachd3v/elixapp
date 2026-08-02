// Resize & JPEG-compress a File → base64 data URL, before we send it up to the
// server. Keeps DB rows sane (target ~40-100 KB per photo instead of raw MB).
export async function fileToCompressedDataUrl(file, { maxDim = 900, quality = 0.75 } = {}) {
  if (!file) return null;
  
  const imgUrl = URL.createObjectURL(file);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Format tidak didukung atau memori penuh saat memuat foto."));
    i.src = imgUrl;
  });
  URL.revokeObjectURL(imgUrl);

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

// Given an image source (data URL or blob URL) and a crop region in the
// original image's pixel space { x, y, width, height }, produce a JPEG data
// URL of just the cropped region. Optionally scale to a max dimension so
// avatars stay small.
export async function croppedDataUrl(imageSrc, crop, { maxDim = 400, quality = 0.8 } = {}) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Format foto tidak didukung atau memori penuh saat memotong gambar."));
    i.src = imageSrc;
  });
  const scale = Math.min(1, maxDim / Math.max(crop.width, crop.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width * scale));
  canvas.height = Math.max(1, Math.round(crop.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

// Load a File as a data URL — useful for feeding to <Cropper> before we know
// the crop region.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
