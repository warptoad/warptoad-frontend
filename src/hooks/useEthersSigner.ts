import { useEffect, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useWalletClient, useChainId } from "wagmi";

type Eip1193Provider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, cb: (...args: any[]) => void) => void;
  removeListener?: (event: string, cb: (...args: any[]) => void) => void;
};

export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  const wagmiChainId = useChainId(); // triggers effect when wallet chain changes
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!walletClient) {
      setSigner(null);
      return;
    }

    const eip1193 = walletClient.transport as unknown as Eip1193Provider;
    const provider = new BrowserProvider(eip1193);

    const refreshSigner = async () => {
      try {
        const s = await provider.getSigner();
        if (!cancelled) setSigner(s);
      } catch {
        if (!cancelled) setSigner(null);
      }
    };

    // initial signer
    refreshSigner();

    // listeners: chain/account changes -> refresh signer
    const handleChainChanged = () => { refreshSigner(); };
    const handleAccountsChanged = (accounts?: string[]) => {
      if (!accounts || accounts.length === 0) {
        if (!cancelled) setSigner(null);
      } else {
        refreshSigner();
      }
    };

    eip1193.on?.("chainChanged", handleChainChanged);
    eip1193.on?.("accountsChanged", handleAccountsChanged);
    eip1193.on?.("disconnect", () => { if (!cancelled) setSigner(null); });

    // ethers provider also emits a 'network' event on changes (belt & suspenders)
    const providerNetworkListener = (_newNet: any, _oldNet: any) => refreshSigner();
    // @ts-ignore - v6 providers support 'on' for 'network'
    provider.on?.("network", providerNetworkListener);

    return () => {
      cancelled = true;
      eip1193.removeListener?.("chainChanged", handleChainChanged);
      eip1193.removeListener?.("accountsChanged", handleAccountsChanged);
      // @ts-ignore
      provider.off?.("network", providerNetworkListener);
    };
    // Re-run when wallet instance or wagmi's chainId changes
  }, [walletClient, wagmiChainId]);

  return signer;
}
