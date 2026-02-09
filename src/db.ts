const DB_NAME = "themeforge_db";
const DB_VERSION = 1;
const STORE_NAME = "sessions";

export interface SessionRecord {
  id?: number;
  timestamp: number;
  screenshotBlob: Blob | null;
  detectionProvider: string;
  detectedApps: string[];
  selectedApps: string[];
  uncheckedApps: string[];
}

export interface StatsRecord {
  totalUploads: number;
  totalDetected: number;
  totalUnchecked: number;
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function saveSession(db: IDBDatabase, data: Omit<SessionRecord, "id">): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export function updateSession(
  db: IDBDatabase,
  id: number,
  selectedApps: string[],
  detectedApps: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) { resolve(); return; }
      record.selectedApps = selectedApps;
      record.uncheckedApps = detectedApps.filter(a => !selectedApps.includes(a));
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export function getSessions(db: IDBDatabase): Promise<SessionRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result as SessionRecord[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export function getStats(db: IDBDatabase): Promise<StatsRecord> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const sessions = request.result as SessionRecord[];
      resolve({
        totalUploads: sessions.length,
        totalDetected: sessions.reduce((sum, s) => sum + s.detectedApps.length, 0),
        totalUnchecked: sessions.reduce((sum, s) => sum + s.uncheckedApps.length, 0),
      });
    };
    request.onerror = () => reject(request.error);
  });
}
