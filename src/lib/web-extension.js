const extensionApi = globalThis.browser ?? globalThis.chrome;

if (!extensionApi) {
  throw new Error("WebExtension API non disponibile");
}

export async function storageGet(key) {
  const result = await extensionApi.storage.local.get(key);
  return result[key];
}

export async function storageSet(values) {
  await extensionApi.storage.local.set(values);
}

export async function storageRemove(key) {
  await extensionApi.storage.local.remove(key);
}

export async function activeTab() {
  const tabs = await extensionApi.tabs.query({ active: true, currentWindow: true });
  return tabs[0] ?? null;
}

export async function openTab(url) {
  await extensionApi.tabs.create({ url });
}
