import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AztecWallet } from "@azguardwallet/aztec-wallet";
import type { Wallet } from "@aztec/aztec.js";

type AzguardContextValue = {
  isInstalled: boolean;
  isConnected: () => boolean;
  address: string | null;
  wallet: AztecWallet | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const AzguardContext = createContext<AzguardContextValue | null>(null);

export function AzguardProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<AztecWallet | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const initOnceRef = useRef(false);

  useEffect(() => {
    setIsInstalled(!!window.azguard);
  }, []);

  //auto reconnect session if exists
  useEffect(() => {
    if (!isInstalled || initOnceRef.current) return;
    initOnceRef.current = true;

    (async () => {
      try {
        // The SDK will silently reconnect if a session exists
        const existingWallet = await AztecWallet.connect(
          {
            name: "Warptoad",
            description: "Warptoad — Cross-Chain Privacy Token Standard",
            logo: "https://warptoad.org/assets/WarptoadLogo.svg",
            url: "https://warptoad.xyz/",
          },
          "sandbox" // or mainnet/CAIP string
        );

        setWallet(existingWallet);
        setAddress(existingWallet.getAddress().toString());
      } catch (err) {
        console.debug("No existing Azguard session:", err);
      }
    })();
  }, [isInstalled]);

  function isConnected() {
    return !!wallet && wallet.connected;
  }

  async function connect() {
    if (!isInstalled) return;
    if (wallet) return;

    const newWallet = await AztecWallet.connect(
      {
        name: "Warptoad",
        description: "Warptoad — Cross-Chain Privacy Token Standard",
        logo: "https://warptoad.org/assets/WarptoadLogo.svg",
        url: "https://warptoad.xyz/",
      },
      "sandbox"
    );

    setWallet(newWallet);
    setAddress(newWallet.getAddress().toString());
  }

  async function disconnect() {
    if (!wallet) return;
    await wallet.disconnect();
    setAddress(null);
    setWallet(null);
  }

  const value: AzguardContextValue = {
    isInstalled,
    isConnected,
    address,
    wallet,
    connect,
    disconnect,
  };

  return (
    <AzguardContext.Provider value={value}>
      {children}
    </AzguardContext.Provider>
  );
}

export function useAzguard() {
  const ctx = useContext(AzguardContext);
  if (!ctx) throw new Error("useAzguard must be used within <AzguardProvider>");
  return ctx;
}
