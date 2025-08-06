import { useEffect, useRef, useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect, useAccount } from 'wagmi';

function ConnectWalletButton() {
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [wasModalOpen, setWasModalOpen] = useState(false);

    const openDialog = () => dialogRef.current?.showModal();
    const closeDialog = () => dialogRef.current?.close();
    const { disconnect: disconnectRainbowKit } = useDisconnect();
    const { address: rainbowKitAddress, isConnected: isRainbowKitConnected } = useAccount();

    const isAztecConnected: boolean = false;

    return (
        <>
            <button className="btn" onClick={openDialog}>
                connect wallet
            </button>

            <dialog ref={dialogRef} id="walletsModal" className="modal">
                <div className="modal-box flex flex-col gap-2">
                    <h3 className="font-bold text-lg">Connect your Wallets</h3>

                    <div className="w-full flex justify-between gap-2">
                        {isRainbowKitConnected ? (
                            <>
                                <button className="btn flex-1/2">
                                    {rainbowKitAddress ? `${rainbowKitAddress.slice(0, 4)}...${rainbowKitAddress.slice(-4)}` : ""}
                                </button>
                                <button className="btn" onClick={() => { disconnectRainbowKit() }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-power-icon lucide-power"><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></svg>
                                </button>
                            </>
                        ) : (
                            <ConnectButton.Custom>
                                {({ openConnectModal, connectModalOpen }) => {
                                    useEffect(() => {
                                        if (wasModalOpen && !connectModalOpen) {
                                            openDialog();
                                        }
                                        setWasModalOpen(connectModalOpen);
                                    }, [connectModalOpen]);

                                    return (
                                        <button
                                            className="btn flex-1/2"
                                            onClick={() => {
                                                closeDialog();
                                                openConnectModal();
                                            }}
                                        >
                                            Connect EVM Wallet
                                        </button>
                                    );
                                }}
                            </ConnectButton.Custom>
                        )}
                    </div>

                    <div className="w-full flex justify-between gap-2">
                        {isAztecConnected ? (
                            <>
                                <button className="btn flex-1/2">
                                    {rainbowKitAddress ? `${rainbowKitAddress.slice(0, 4)}...${rainbowKitAddress.slice(-4)}` : ""}
                                </button>
                                <button className="btn" onClick={() => { }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-power-icon lucide-power"><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></svg>
                                </button>
                            </>
                        ) : (
                            <button className="btn flex-1/2">
                                Connect Aztec Wallet
                            </button>
                        )}
                    </div>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}

export default ConnectWalletButton;
