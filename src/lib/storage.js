const storage = {
  async set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  async get(key) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  },
  async list() {
    return Object.keys(localStorage).filter(k => k.startsWith("session_"));
  },
  async delete(key) { localStorage.removeItem(key); },
};

export default storage;
