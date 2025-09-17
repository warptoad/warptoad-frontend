
import { useAccount } from "wagmi";
import { CustomConnectKitButton } from "../components/CustomConnectKitButton";
import AztecCustomWallet from "../components/Aztec/AztecCustomWallet";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { config } from "../config/wagmiConfig";
import { evmDeployments } from "@warp-toad/backend/deployment";
import { WarpToadCore__factory } from "@warp-toad/backend/ethers/typechain-types";


function Account() {
    const { isConnected } = useAccount();

    async function handleMintTokens() {
        const txHash = await writeContract(config, {
            abi: WarpToadCore__factory.abi,
            address: evmDeployments[534351]["L2ScrollModule#L2WarpToad"] as `0x%{string}`,
            functionName: "getFreeShit",
            args: [100n * 10n ** 6n],
        })
        //@ts-ignore
        const receipt = await waitForTransactionReceipt(config, { hash: txHash });
    }

    return (
        <div className="p-2 md:p-0 h-full flex items-center justify-center" >
            <div className="w-full h-12/12 md:h-6/12 flex flex-col items-center justify-center p-2 gap-2">
                <div className="md:min-w-2/5 border rounded-2xl flex flex-col items-center p-2 gap-2">
                    <div className="flex gap-2 items-center p-2">
                        <div aria-label="status" className={`status status-xl ${isConnected ? "status-success" : "status-error"}`}></div>
                        <p className="btn btn-secondary">EVM wallet</p>
                        <CustomConnectKitButton />
                        <button
                            className="btn btn-secondary btn-outline" onClick={handleMintTokens}>freeToken</button>
                    </div>
                    <div className="flex gap-2 p-2 items-center">
                        <div aria-label="status" className={`status status-xl ${isConnected ? "status-success" : "status-error"}`}></div>
                        <p className="btn btn-secondary">Aztec wallet</p>
                        <AztecCustomWallet />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Account
