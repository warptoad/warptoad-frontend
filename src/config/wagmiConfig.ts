import { createConfig, http } from "wagmi";
//@ts-ignore
import { scrollSepolia } from "viem/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  connectors: [walletConnect({
      projectId: '4e4329647f66007b45466407bb1db216',
      showQrModal: false,
    }),],
  chains: [scrollSepolia],
  transports: {
    [scrollSepolia.id]: http(),
  },
  ssr: true,
});