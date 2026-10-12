// Resize & JPEG-compress a File → base64 data URL, before we send it up to the
// server. Keeps DB rows sane (target ~40-100 KB per photo instead of raw MB).
export async function fileToCompressedDataUrl(file, { maxDim = 900, quality = 0.75 } = {}) {
  if (!file) return null;

  // Diagnostic check for HEIC/HEIF
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();
  if (fileType.includes('heic') || fileType.includes('heif') || fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
    throw new Error('Format foto HEIC/HEIF tidak didukung langsung oleh browser. Silakan ubah pengaturan kamera HP ke JPEG (Paling Kompatibel) atau simpan sebagai JPG/PNG.');
  }

  let img, width, height;

  try {
    // Attempt 1: Modern, memory-efficient way (decodes off main thread)
    if (typeof window !== 'undefined' && window.createImageBitmap) {
      img = await createImageBitmap(file);
      width = img.width;
      height = img.height;
    } else {
      throw new Error('createImageBitmap not supported');
    }
  } catch (err1) {
    try {
      // Attempt 2: Fallback to Object URL
      img = await new Promise((resolve, reject) => {
        const i = new Image();
        const url = URL.createObjectURL(file);
        i.onload = () => { URL.revokeObjectURL(url); resolve(i); };
        i.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Object URL decoding failed')); };
        i.src = url;
      });
      width = img.width;
      height = img.height;
    } catch (err2) {
      // Attempt 3: Fallback to FileReader
      try {
        img = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error('FileReader decoding image failed'));
            i.src = fr.result;
          };
          fr.onerror = () => reject(new Error('Gagal membaca file foto'));
          fr.readAsDataURL(file);
        });
        width = img.width;
        height = img.height;
      } catch (err3) {
        console.error('Semua metode pemuatan gambar gagal:', { err1, err2, err3, fileInfo: { name: file.name, size: file.size, type: file.type } });
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(`Gagal memuat foto (${file.name || 'file'}, ${sizeMb} MB). Kemungkinan memori HP penuh atau kamera mengambil resolusi terlalu tinggi. Coba gunakan opsi Galeri atau turunkan resolusi kamera.`);
      }
    }
  }

  if (!width || !height) {
    if (img?.close) img.close();
    throw new Error('Dimensi gambar tidak valid (0x0). Silakan coba ambil ulang fotonya.');
  }

  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (img?.close) img.close();
    throw new Error('Browser kehabisan memori untuk memproses gambar. Silakan muat ulang browser atau gunakan foto dari Galeri.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  // Free memory if ImageBitmap was used
  if (img?.close) img.close();

  const result = canvas.toDataURL('image/jpeg', quality);
  if (!result || result === 'data:,') {
    throw new Error('Gagal mengekspor foto dari canvas. Coba ambil ulang foto dengan pencahayaan cukup.');
  }
  return result;
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
