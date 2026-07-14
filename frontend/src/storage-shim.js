const PREFIX = "dispatch_ledger_";

if (!window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(`${PREFIX}${key}`);
      return value != null ? { value } : null;
    },
    async set(key, value) {
      localStorage.setItem(`${PREFIX}${key}`, value);
    },
  };
}
