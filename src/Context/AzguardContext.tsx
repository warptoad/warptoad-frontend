// AzguardContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AzguardClient } from "@azguardwallet/client";

type AzguardContextValue = {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  client: AzguardClient | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const AzguardContext = createContext<AzguardContextValue | null>(null);

export function AzguardProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<AzguardClient | null>(null);
  const initOnceRef = useRef(false); // guard against React 18 StrictMode double-invoke in dev

  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    let removeHandlers: Array<() => void> = [];

    (async () => {
      const installed = await AzguardClient.isAzguardInstalled();
      setIsInstalled(installed);
      if (!installed) return;

      const client = await AzguardClient.create();
      clientRef.current = client;

      // initial snapshot
      setIsConnected(client.connected);
      setAddress(client.accounts?.[0] ?? null);

      // disconnected
      const onDisconnected = () => {
        setIsConnected(false);
        setAddress(null);
      };
      client.onDisconnected.addHandler(onDisconnected);
      removeHandlers.push(() => client.onDisconnected.removeHandler(onDisconnected));

      // optional: if SDK exposes account/connected events, wire them similarly
      if (client.onAccountsChanged?.addHandler) {
        const onAccountsChanged = (accounts: string[]) => setAddress(accounts?.[0] ?? null);
        client.onAccountsChanged.addHandler(onAccountsChanged);
        removeHandlers.push(() => client.onAccountsChanged.removeHandler(onAccountsChanged));
      }

      
      if (client.onConnected?.addHandler) {
        const onConnected = () => setIsConnected(true);
        client.onConnected.addHandler(onConnected);
        removeHandlers.push(() => client.onConnected.removeHandler(onConnected));
      }
    })();

    return () => {
      for (const rm of removeHandlers) {
        try { rm(); } catch {}
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (!isInstalled) return;
    const client = clientRef.current ?? (await AzguardClient.create());
    clientRef.current = client;

    if (!client.connected) {
      await client.connect(
        { name: "Warptoad" },
        [
          {
            chains: ["aztec:11155111"],
            methods: ["send_transaction", "add_private_authwit", "call"],
          },
        ],
      );
    }
    setIsConnected(client.connected);
    setAddress(client.accounts?.[0] ?? null);
  }, [isInstalled]);

  const disconnect = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    if (typeof (client as any).disconnect === "function") {
      await (client as any).disconnect(); // will trigger onDisconnected
    } else {
      setIsConnected(false);
      setAddress(null);
    }
  }, []);

  const value: AzguardContextValue = {
    isInstalled,
    isConnected,
    address,
    client: clientRef.current,
    connect,
    disconnect,
  };

  return <AzguardContext.Provider value={value}>{children}</AzguardContext.Provider>;
}

export function useAzguard() {
  const ctx = useContext(AzguardContext);
  if (!ctx) throw new Error("useAzguard must be used within <AzguardProvider>");
  return ctx;
}
