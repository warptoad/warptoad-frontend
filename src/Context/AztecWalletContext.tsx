// AzguardContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPXEClient, waitForPXE, type PXE, type Wallet, GrumpkinScalar, SponsoredFeePaymentMethod, Fr, type ContractInstanceWithAddress, createAztecNodeClient, AztecAddress } from '@aztec/aztec.js';
import { WarpToadCoreContractArtifact, WarpToadCoreContract } from "@warp-toad/backend/aztec/WarpToadCore";
import { L2AztecBridgeAdapterContract, L2AztecBridgeAdapterContractArtifact} from "@warp-toad/backend/aztec/L2AztecBridgeAdapter";
import { getContractAddressesAztec } from "warp-toad-old-backend/deployment";


type AzguardContextValue = {
  isConnected: boolean;
  address: string | null;
  wallet: Wallet | null;
  pxe: PXE | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const AztecWalletContext = createContext<AzguardContextValue | null>(null);

export function AztecWalletProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Wallet | null>(null);
  const initOnceRef = useRef(false);

  const [pxeStore, setPxeStore] = useState<PXE | null>();

  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  async function instantiatePXE() {

    const delay = async (timeInMs: number) => await new Promise((resolve) => setTimeout(resolve, timeInMs))
    const { PXE_URL = 'http://localhost:8080' } = process.env;
    const PXE = createPXEClient(PXE_URL);
    await waitForPXE(PXE);
    setPxeStore(PXE);

    const addresses = await getContractAddressesAztec(11155111n)
    const AztecWarpToadAddress = addresses.AztecWarpToad
    const L2AztecAdapterAddress = addresses.L2AztecBridgeAdapter

    console.log("assuming ur not on sand box so registering the contracts with aztec testnet node")

    const node = createAztecNodeClient("https://aztec-alpha-testnet-fullnode.zkv.xyz")
    const AztecWarpToadContract = await node.getContract(AztecAddress.fromString(AztecWarpToadAddress))
    console.log("2")
    if (AztecWarpToadContract) {

      await PXE.registerContract({
        instance: AztecWarpToadContract,
        //@ts-ignore
        artifact: WarpToadCoreContractArtifact,
      })
      console.log("3")
      await delay(10000)
      const L2AztecAdapterContract = await node.getContract(AztecAddress.fromString(L2AztecAdapterAddress))

      if (L2AztecAdapterContract) {
        await PXE.registerContract({
          instance: L2AztecAdapterContract,
        //@ts-ignore
          artifact: L2AztecBridgeAdapterContractArtifact,
        })
        await delay(10000)
      }
    }

  }

  useEffect(() => {
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    let removeHandlers: Array<() => void> = [];

    (async () => {

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
        try { rm(); } catch { }
      }
    };
  }, []);

  const connect = useCallback(async () => {

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
  }, []);

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
    isConnected,
    address,
    client: clientRef.current,
    connect,
    disconnect,
  };

  return <AztecWalletContext.Provider value={value}>{children}</AztecWalletContext.Provider>;
}

export function useAztecWallet() {
  const ctx = useContext(AztecWalletContext);
  if (!ctx) throw new Error("useAzguard must be used within <AztecWalletProvider>");
  return ctx;
}
