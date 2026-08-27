const KEY = 'pt_ventes_offline';

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

function setQueue(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('pt-offline-queue-changed'));
}

export function addToQueue(item) {
  const list = getQueue();
  list.push({ ...item, localId: Date.now() + '-' + Math.random().toString(36).slice(2), createdAt: new Date().toISOString() });
  setQueue(list);
}

export function removeFromQueue(localId) {
  setQueue(getQueue().filter(i => i.localId !== localId));
}

export function queueLength() {
  return getQueue().length;
}
