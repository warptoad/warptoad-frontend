import { useEffect, useState } from 'react';
import { config } from "../../config/wagmiConfig";
import { testFactory } from "./Contracts/testFactoryConfig";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import type { AdminPairs } from '../../types/Admin';
/** 
     * create Pair (tokenA<>TokenB, Eth<>TokenA, Eth<>TokenB)
 */

type AdminRetirePairProps = {
    pairCreated: boolean;
    onDelete: () => void;
};


const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const;
function AdminRetirePair({ pairCreated, onDelete }: AdminRetirePairProps) {
    const [pairs, setPairs] = useState<AdminPairs[]>([]);

    async function fetchPairData() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL+"/pairs")
            console.log(res);
            const data: AdminPairs[] = await res.json();
            console.log(data);
            setPairs(data);

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchPairData()
    }, []);
    useEffect(() => {
        if (pairCreated) {
            refetchData()
            pairCreated = false;
        }
    }, [pairCreated]);

    async function refetchData() {
        console.log("refetching data")
        await fetchPairData()
    }

    async function handlePairRetirement(tokenA: String, tokenB: String) {

        try {
            const txHash = await writeContract(config, {
                abi: testFactory.abi,
                address: testFactory.address,
                functionName: "retirePair",
                args: [
                    tokenA,
                    tokenB
                ],
            });

            console.log("retirePair TX:", txHash);

            await waitForTransactionReceipt(config, { hash: txHash });

            setPairs(prev =>
                prev.filter(p => !(p.tokenA === tokenA && p.tokenB === tokenB))
            );

            await refetchData();
            onDelete()

        } catch (err) {
            console.error("Error createPair:", err);
        }
    }



    return (
        <div className="lg:w-1/2 h-full rounded-2xl border-1 flex flex-col items-center gap-4 p-4">
            <h1 className="font-[AeonikFono] font-medium text-2xl uppercase">Factory Retire Pair</h1>
            <div className="w-full border-1 p-4 rounded-2xl flex-grow flex flex-col gap-2">
                <div className="flex justify-between gap-2 items-center">
                    <p className="font-['AeonikFono'] ">Retire a token pair</p>
                    <label className="input flex-grow">
                        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <g
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                strokeWidth="2.5"
                                fill="none"
                                stroke="currentColor"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                            </g>
                        </svg>
                        <input type="search" className="grow" placeholder="Search" />
                    </label>
                </div>
                <div className="divider m-0"></div>
                <div className="flex flex-grow max-h-64 flex-col gap-2 w-full overflow-y-scroll">
                    {pairs.map((pair) => (
                        <div key={pair.id.toString()} className="rounded-4xl border p-2 flex items-center justify-between">
                            <p className='btn btn-secondary cursor-default'>ID: {pair.id.toString()}</p>

                            <div className='flex flex-col items-center'>
                                {pair.tokenA === ZERO_ADDR ? (
                                    <p>Gas Token</p>
                                ) : (
                                    <a
                                        className='link link-secondary flex gap-2'
                                        target='_blank'
                                        href={`https://sepolia.abscan.org/address/${pair.tokenA}#code`}
                                    >
                                        {`${pair.tokenA.slice(0, 5)}...${pair.tokenA.slice(-5)}`}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link-icon lucide-external-link"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                    </a>
                                )}

                                {pair.tokenB === ZERO_ADDR ? (
                                    <p>Gas Token</p>
                                ) : (
                                    <a
                                        className='link link-secondary flex gap-2'
                                        target='_blank'
                                        href={`https://sepolia.abscan.org/address/${pair.tokenB}#code`}
                                    >
                                        {`${pair.tokenB.slice(0, 5)}...${pair.tokenB.slice(-5)}`}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link-icon lucide-external-link"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                    </a>
                                )}
                            </div>

                            <button
                                className='btn btn-error'
                                onClick={async () => { await handlePairRetirement(pair.tokenA, pair.tokenB) }}
                            >
                                retire
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminRetirePair;
