import { createConfig, http } from "wagmi";
//@ts-ignore
import { scrollSepolia, sepolia } from "viem/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  connectors: [walletConnect({
      projectId: '4e4329647f66007b45466407bb1db216',
      showQrModal: false,
    }),],
  chains: [
    sepolia, 
    scrollSepolia 
  ],
  transports: {
    [sepolia.id]: http(),
    [scrollSepolia.id]: http(),
  },
  ssr: true,
});