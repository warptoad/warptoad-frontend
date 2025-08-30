
import { useAzguard } from "../../Context/AzguardContext";
import { useState } from "react";

const shorten = (input?: string | null) => {
    if (!input) return "";
    const addr = input.includes("0x") ? input.slice(input.indexOf("0x")) : input;
    return addr.length <= 10 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};


function AzguardWallet() {
    const { isInstalled, isConnected, address, connect, disconnect } = useAzguard();
    const [hover, setHover] = useState(false);


    if (!isInstalled) {
        return (
            <button
                className="btn btn-secondary btn-outline"
                onClick={() =>
                    window.open(
                        "https://chromewebstore.google.com/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn",
                        "_blank"
                    )
                }
            >
                Install Azguard
            </button>
        );
    }

    return isConnected ? (
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
        <button className="btn btn-secondary btn-outline" onClick={connect}>
            Connect
        </button>
    );
}

export default AzguardWallet