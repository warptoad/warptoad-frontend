import { createConfig, http } from "wagmi";
//@ts-ignore
import { abstractTestnet, abstract } from "viem/chains"; // Use abstract for mainnet
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";

export const config = createConfig({
  connectors: [abstractWalletConnector()],
  chains: [abstract],
  transports: {
    [abstract.id]: http(),
  },
  ssr: true,
});