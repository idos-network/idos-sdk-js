const DB_NAME = "idOS:facesign";
const DB_STORE_NAME = "idOS:facesign:keystore";

async function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      try {
        db.deleteObjectStore(DB_STORE_NAME);
      } catch (_e) {
        // ignore
      }
      db.createObjectStore(DB_STORE_NAME, { keyPath: "name" });
    };
    req.onsuccess = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn("openDB: blocked");
  });
}

export async function storeGet<T>(id: string): Promise<T | undefined> {
  const db = await openDatabase();

  const tx = db.transaction(DB_STORE_NAME, "readonly");
  const store = tx.objectStore(DB_STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => reject(req.error);
  });
}

export async function storeSet<T>(id: string, value: T): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE_NAME, "readwrite");
  const store = tx.objectStore(DB_STORE_NAME);
  store.put({ name: id, value });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted in storeSet"));
  });
}
