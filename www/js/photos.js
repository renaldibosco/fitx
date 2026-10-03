// NrXFitz — progress photos in IndexedDB (kept off localStorage, which is small)
const DB = 'nrxfitz-photos', STORE = 'photos';
function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const out = fn(t.objectStore(STORE)); t.oncomplete = () => res(out?.result ?? out); t.onerror = () => rej(t.error); });
}
export async function listPhotos() {
  const db = await open();
  return new Promise((res, rej) => { const r = db.transaction(STORE).objectStore(STORE).getAll(); r.onsuccess = () => res(r.result.sort((a, b) => b.ts - a.ts)); r.onerror = () => rej(r.error); });
}
export const addPhoto = p => tx('readwrite', s => s.put(p));
export const deletePhoto = id => tx('readwrite', s => s.delete(id));
export const clearPhotos = () => tx('readwrite', s => s.clear());

// Downscale a picked image to a compact JPEG data URL
export function shrinkImage(file, max = 900) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read image')); };
    img.src = url;
  });
}
