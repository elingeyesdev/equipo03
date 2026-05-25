type Listener = () => void;
let listeners: Listener[] = [];

export const authEvents = {
  onForceLogout: (fn: Listener): (() => void) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },
  emitForceLogout: () => {
    listeners.forEach(fn => fn());
  },
};
