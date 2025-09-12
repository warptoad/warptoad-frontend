import { useEffect, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useWalletClient } from "wagmi";

// Minimal EIP-1193 shape (what BrowserProvider needs)
type Eip1193Provider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
};

export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!walletClient) {
        setSigner(null);
        return;
      }
      const eip1193 = (walletClient.transport as unknown) as Eip1193Provider;

      const provider = new BrowserProvider(eip1193);
      const s = await provider.getSigner(); 

      if (!cancelled) setSigner(s);
    })();

    return () => {
      cancelled = true;
    };
  }, [walletClient]);

  return signer;
}
