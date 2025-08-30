import { useState } from "react";
import { parseEther, isAddress } from "viem";
import { testToken1 } from "./Test/TestToken1Config";
import { config } from "../../config/wagmiConfig";
import { writeContract } from "@wagmi/core";
import { testToken2 } from "./Test/TestToken2Config";
import { testNFT } from "./Test/TestOCBMockConfig";

function AdminMintToken() {
    const [tokenAAmount, setTokenAAmount] = useState<bigint>(0n);
    const [tokenBAmount, setTokenBAmount] = useState<bigint>(0n);

    const [tokenAAddress, setTokenAAddress] = useState<string>("");
    const [tokenBAddress, setTokenBAddress] = useState<string>("");
    const [nftAddress, setNftAddress] = useState<string>("");

    async function handleTokenAMint() {
        if (!isAddress(tokenAAddress)) {
            alert("not a valid address");
            return
        }
        if (tokenAAmount <= 0n) {
            alert("invalid token amount");
            return
        }

        const result = await writeContract(config, {
            abi: testToken1.abi,
            address: testToken1.address as `0x${string}`,
            functionName: 'mint',
            args: [
                tokenAAddress,
                tokenAAmount
            ],
        })

        console.log("Mint Token A:", result);
        // Call your mint function here
    }

    async function handleTokenBMint() {
        if (!isAddress(tokenBAddress)) {
            alert("not a valid address");
            return
        }
        if (tokenBAmount <= 0n) {
            alert("invalid token amount");
            return
        }

        const result = await writeContract(config, {
            abi: testToken2.abi,
            address: testToken2.address as `0x${string}`,
            functionName: 'mint',
            args: [
                tokenBAddress,
                tokenBAmount
            ],
        })
        console.log("Mint Token B:", result);
        // Call your mint function here
    }

    async function handleNFT() {
        if (!isAddress(nftAddress)) {
            alert("not a valid address");
            return
        }

        const result = await writeContract(config, {
            abi: testNFT.abi,
            address: testNFT.address as `0x${string}`,
            functionName: 'safeMint',
            args: [
                nftAddress
            ],
        })

        console.log("Mint NFT:", result);
        // Call your mint function here
    }

    return (
        <div className="h-full lg:w-1/2 rounded-2xl border-1 flex flex-col items-center justify-center gap-4 p-4">
            <h1 className="font-[AeonikFono] font-medium text-2xl uppercase col-span-2">Mint Tokens</h1>
            <div className="w-full grid grid-cols-2 gap-2">

                {/* Token A */}
                <div className="w-full flex flex-col gap-2 border-1 p-4 rounded-2xl">
                    <p className="font-['AeonikFono']">mint Token A</p>
                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="address"
                            value={tokenAAddress}
                            onChange={(e) => setTokenAAddress(e.target.value)}
                        />
                        <input
                            type="number"
                            className="input w-full"
                            placeholder="amount in ETH"
                            onChange={(e) =>
                                setTokenAAmount(parseEther(e.target.value || "0"))
                            }
                        />
                    </div>
                    <button onClick={handleTokenAMint} className="btn btn-secondary">
                        mint
                    </button>
                </div>

                {/* Token B */}
                <div className="w-full flex flex-col gap-2 border-1 p-4 rounded-2xl">
                    <p className="font-['AeonikFono'] ">mint Token B</p>
                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="address"
                            value={tokenBAddress}
                            onChange={(e) => setTokenBAddress(e.target.value)}
                        />
                        <input
                            type="number"
                            className="input w-full"
                            placeholder="amount in ETH"
                            onChange={(e) =>
                                setTokenBAmount(parseEther(e.target.value || "0"))
                            }
                        />
                    </div>
                    <button onClick={handleTokenBMint} className="btn btn-secondary">
                        mint
                    </button>
                </div>

                {/* NFT */}
                <div className="w-full flex flex-col gap-2 border-1 p-4 rounded-2xl col-span-2">
                    <p className="font-['AeonikFono'] ">mint NFT</p>
                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="address"
                            value={nftAddress}
                            onChange={(e) => setNftAddress(e.target.value)}
                        />
                    </div>
                    <button onClick={handleNFT} className="btn btn-secondary">
                        mint
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminMintToken;
