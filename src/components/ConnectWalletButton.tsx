import { useEffect, useRef, useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function ConnectWalletButton() {
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [wasModalOpen, setWasModalOpen] = useState(false);

    const openDialog = () => dialogRef.current?.showModal();
    const closeDialog = () => dialogRef.current?.close();

    return (
        <>
            <button className="btn" onClick={openDialog}>
                connect
            </button>

            <dialog ref={dialogRef} id="walletsModal" className="modal">
                <div className="modal-box flex flex-col gap-2">
                    <h3 className="font-bold text-lg">Connect your Wallets</h3>

                    <div className="w-full flex justify-between gap-2">
                        <button className="btn">X</button>

                        <ConnectButton.Custom>
                            {({ openConnectModal, connectModalOpen }) => {
                                // Watch for modal close
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

                        <button className="btn">out</button>
                    </div>

                    <div className="w-full flex justify-between gap-2">
                        <button className="btn">X</button>
                        <button className="btn flex-1/2">connect aztec Wallet</button>
                        <button className="btn">out</button>
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
