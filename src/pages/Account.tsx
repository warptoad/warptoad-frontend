
import { useAccount } from "wagmi";
import { CustomConnectKitButton } from "../components/CustomConnectKitButton";
import AztecCustomWallet from "../components/Aztec/AztecCustomWallet";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { config } from "../config/wagmiConfig";
import { abi as testTokenAbi } from "../components/artifacts/chain-11155111/artifacts/TestTokenUSDcoin.json";
import l1Addresses from "../components/artifacts/chain-11155111/deployed_addresses.json";


function Account() {
    const { isConnected } = useAccount();

    async function handleMintTokens() {
        const txHash = await writeContract(config, {
            abi: testTokenAbi,
            address: l1Addresses["TestToken#USDcoin"] as `0x%{string}`,
            functionName: "getFreeShit",
            args: [100n * 10n ** 6n],
        })
        //@ts-ignore
        const receipt = await waitForTransactionReceipt(config, { hash: txHash });
    }

    return (
        <div className="p-2 md:p-0 h-full flex items-center justify-center" >
            <div className="w-full h-12/12 md:h-6/12 flex flex-col items-center justify-center p-2 gap-2">
                <div className="md:w-2/5 border rounded-2xl flex flex-col items-center p-2 gap-2">
                    <div className="flex gap-2 items-center">
                        <div aria-label="status" className={`status status-xl ${isConnected ? "status-success" : "status-error"}`}></div>
                        <p className="btn btn-secondary">EVM wallet</p>
                        <CustomConnectKitButton />
                        <button
                            className="btn btn-secondary btn-outline" onClick={handleMintTokens}>freeToken</button>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div aria-label="status" className={`status status-xl ${isConnected ? "status-success" : "status-error"}`}></div>
                        <p className="btn btn-secondary">Aztec wallet</p>
                        <AztecCustomWallet/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Account
