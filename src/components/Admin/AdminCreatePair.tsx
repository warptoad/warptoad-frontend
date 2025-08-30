import { useEffect, useMemo, useState } from 'react';
import { useReadContract } from 'wagmi';
import { isAddress } from "viem";
import { config } from "../../config/wagmiConfig";
import { testFactory } from "./Contracts/testFactoryConfig";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
/** 
     * create Pair (tokenA<>TokenB, Eth<>TokenA, Eth<>TokenB)
 */

type AdminCreatePairProps = {
    pairDeleted: boolean;
    onCreate: () => void;
};

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const;
function AdminCreatePair({ pairDeleted, onCreate }: AdminCreatePairProps) {

    const [tokenAInput, setTokenAInput] = useState<string>("");
    const [tokenBInput, setTokenBInput] = useState<string>("");

    const {
        data: pairCount,
        refetch: refetchPairCount,//@ts-ignore
        isFetching: pairCountLoading,
    } = useReadContract({
        address: testFactory.address,
        abi: testFactory.abi,
        functionName: 'getPairAmount',
    });

    async function refetchData() {
        await refetchPairCount()
    }
    useEffect(() => {
        if (pairDeleted) {
            refetchData();
            pairDeleted = false;
        }
    }, [pairDeleted]);

    const currentPairCount = useMemo(
        () => pairCount,
        [pairCount]
    );

    async function handlePairCreation() {

        try {
            const txHash = await writeContract(config, {
                abi: testFactory.abi,
                address: testFactory.address,
                functionName: "createPair",
                args: [
                    tokenAInput,
                    tokenBInput
                ],
            });

            console.log("createPair TX:", txHash);

            await waitForTransactionReceipt(config, { hash: txHash });

            console.log("Transaction confirmed, refetching...");
            await refetchData();
            onCreate();

        } catch (err) {
            console.error("Error createPair:", err);
        }
    }



    return (
        <div className="h-full lg:w-1/2 rounded-2xl border-1 flex flex-col items-center justify-center gap-4 p-4">
            <div className='flex gap-2 items-center'>
                <h1 className="font-[AeonikFono] font-medium text-2xl uppercase col-span-2">Factory Create Pair</h1>
            </div>
            <div className="w-full grid grid-cols-2 gap-2">

                <div className="w-full flex flex-col gap-2 border-1 p-4 rounded-2xl col-span-2">
                    <div className="flex justify-between">
                        <p className="font-['AeonikFono'] ">Create a new token pair</p>
                        <div className='flex gap-2'>
                            <p>
                                pairs created:
                            </p>
                            <p className="badge badge-info font-black">{currentPairCount ? Number(currentPairCount).toString() : "0"}</p>
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <div className='w-full flex gap-2'>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="tokenA"
                                value={tokenAInput}
                                onChange={(e) => setTokenAInput(e.target.value)}
                                disabled={tokenAInput == ZERO_ADDR}
                            />
                            <button className={`btn ${(tokenAInput == ZERO_ADDR) ? "btn-warning" : "btn-secondary"}`}
                                onClick={() => { (tokenAInput == ZERO_ADDR) ? setTokenAInput("") : setTokenAInput(ZERO_ADDR) }}
                            >Toggle ETH</button>
                        </div>
                        <div className='w-full flex gap-2'>
                            <input
                                type="text"
                                className="input flex-grow"
                                placeholder="tokenB"
                                value={tokenBInput}
                                onChange={(e) => setTokenBInput(e.target.value)}
                                disabled={tokenBInput == ZERO_ADDR}
                            />
                            <button className={`btn ${(tokenBInput == ZERO_ADDR) ? "btn-warning" : "btn-secondary"}`}
                                onClick={() => { (tokenBInput == ZERO_ADDR) ? setTokenBInput("") : setTokenBInput(ZERO_ADDR) }}
                            >Toggle ETH</button>
                        </div>
                        <button className='btn btn-secondary' disabled={!isAddress(tokenAInput) || !isAddress(tokenBInput)} onClick={handlePairCreation}>create Pair</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminCreatePair;
