import "../storage-shim.js";

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function loadKey(key, fallback) {
  try {
    const r = await withTimeout(window.storage.get(key, true), 4000, null);
    return r && r.value ? JSON.parse(r.value) : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    await withTimeout(window.storage.set(key, JSON.stringify(value), true), 4000, null);
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}
