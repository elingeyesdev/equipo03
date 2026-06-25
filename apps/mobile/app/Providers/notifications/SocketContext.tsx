import React, { createContext, useContext, useState } from 'react';
import type { Socket } from 'socket.io-client';

type SocketContextValue = {
  socket: Socket | null;
  setSocket: (s: Socket | null) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  setSocket: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  return (
    <SocketContext.Provider value={{ socket, setSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
