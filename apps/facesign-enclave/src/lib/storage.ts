// Simple wrapper later will be updated by encryption etc..
export const storage = {
  set: (key: string, value: string) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: (key: string) => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
};
