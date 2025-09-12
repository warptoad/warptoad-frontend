
import { useAztecWallet } from "../../Context/AztecWalletContext";
import { useState } from "react";

const shorten = (input?: string | null) => {
    if (!input) return "";
    const addr = input.includes("0x") ? input.slice(input.indexOf("0x")) : input;
    return addr.length <= 10 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};


function AztecCustomWallet() {
    const { wallet, address, connect, disconnect, createRandomPrivKey, isLoading } = useAztecWallet();
    const [hover, setHover] = useState(false);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | "">("");

    async function connectWallet() {
        if (!privateKey) return
        try {
            await connect(privateKey)
        } catch (error) {
            console.log(error)
        }
    }

    return wallet ? (
        <button
            className="btn btn-secondary"
            onClick={disconnect}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            title="Disconnect"
        >
            {hover ? "Disconnect" : shorten(address)}
        </button>
    ) : (
        <>
            <button
                disabled={isLoading}
                className="btn btn-secondary btn-outline"
                onClick={() =>
                    setPrivateKey(createRandomPrivKey())
                }
            >
                randomize
            </button>
            <input disabled={isLoading} type="text" placeholder="Type here" value={privateKey} className="input input-secondary bg-base-200" onChange={(e) => setPrivateKey(e.target.value as `0x${string}` | "")} />
            <button
                disabled={isLoading}
                className="btn btn-secondary"
                onClick={() => {
                    connectWallet()
                }
                }
            >
                {
                    isLoading ? (
                        <>
                            connecting
                            <span className="loading loading-dots"></span>
                        </>
                    ) : (
                        <>
                            connect
                        </>
                    )
                }
            </button>
        </>
    );
}

export default AztecCustomWallet