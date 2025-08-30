
import { AzguardClient } from "@azguardwallet/client";
import { useEffect, useState } from "react";

function AzguardWallet() {
    //const { address: userAddress, isConnected } = useAccount();
    const [isConnected, setIsConnected] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [azguardClient, setAzguardClient] = useState<AzguardClient | null>(null);
    const [connectedAddress, setConnectedAddress] = useState("");
    const [hover, setHover] = useState(false);


    useEffect(() => {
        checkIfAzguardInstalled()
    }, [])

    useEffect(() => {
        if (isInstalled) {
            createAzguardClient()
        }
    }, [isInstalled])

    useEffect(() => {
        if (azguardClient) {
            setIsConnected(azguardClient.connected)
            console.log(isConnected)
        }
    }, [azguardClient])

    async function checkIfAzguardInstalled() {
        setIsInstalled(await AzguardClient.isAzguardInstalled());
    }

    async function createAzguardClient() {
        setAzguardClient(await AzguardClient.create());
    }

    async function handleDisconnect() {

        if (isConnected && azguardClient) {
            await azguardClient.disconnect()
            setIsConnected(azguardClient.connected);
        }
    }

    async function handleConnect() {
        if (!isInstalled) {
            // if not, then suggest the user to install it from Chrome Web Store
            // https://chromewebstore.google.com/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn
            return;
        }

        if (azguardClient) {
            azguardClient.onDisconnected.addHandler(() => {
                console.log("Wallet disconnected");
            })

            if (!azguardClient.connected) {
                await azguardClient.connect(
                    {
                        // provide the dapp metadata to be displayed to wallet user
                        name: "Warptoad",
                    },
                    [
                        {
                            chains: ["aztec:11155111"],
                            // specify a list of operations and actions your dapp is going to use
                            methods: ["send_transaction", "add_private_authwit", "call"],
                        },
                    ],
                );
                setIsConnected(azguardClient.connected);
                setConnectedAddress(await azguardClient.accounts[0]);
            }
        }
    }

    function shortenAztecString(input: string): string {
        const addr = input.includes("0x")
            ? input.substring(input.indexOf("0x"))
            : input;

        if (addr.length <= 10) return addr; // nothing to shorten

        return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
    }

    return (
        <>
            {isConnected ? (
                <button
                    className="btn btn-secondary"
                    onClick={handleDisconnect}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                >
                    {hover ? "Disconnect" : shortenAztecString(connectedAddress)}
                </button>
            ) : (
                <button className="btn btn-secondary btn-outline" onClick={handleConnect}>Connect</button> /*change to modal disconnect*/
            )
            }
        </>
    )
}

export default AzguardWallet