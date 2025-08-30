import { ConnectKitButton } from "connectkit";

export const CustomConnectKitButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button onClick={show} className={`btn btn-secondary ${isConnected?"":"btn-outline"} font-[AeonikFono]`}>
            {isConnected ? ensName ?? truncatedAddress : "Connect"}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};