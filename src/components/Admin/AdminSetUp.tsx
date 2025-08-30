import { useMemo, useState } from 'react';
import { useReadContract } from 'wagmi';
import { isAddress } from "viem";
import { config } from "../../config/wagmiConfig";
import { testFactory } from "./Contracts/testFactoryConfig";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
/** 
    * setOCBAddress
    * setFeeReceiver
 */
const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const;
function AdminSetUp() {

    const [ocbAddressInput, setOcbAddressInput] = useState<string>("");
    const [feeReceiverAddressInput, setFeeReceiverAddressInput] = useState<string>("");

    const {
        data: feeReceiver,
        refetch: refetchFeeReceiver,//@ts-ignore
        isFetching: feeLoading,
    } = useReadContract({
        address: testFactory.address,
        abi: testFactory.abi,
        functionName: 'feeReceiver',
    });

    const {
        data: ocbAddress,
        refetch: refetchOcb,//@ts-ignore
        isFetching: ocbLoading,
    } = useReadContract({
        address: testFactory.address,
        abi: testFactory.abi,
        functionName: 'ocbAddress',
    });

    async function refetchData() {
        console.log("refetching data")
        refetchFeeReceiver();
        refetchOcb();
    }

    const isFeeReceiverSet = useMemo(
        () => !!feeReceiver && feeReceiver !== ZERO_ADDR,
        [feeReceiver]
    );
    const isOcbSet = useMemo(
        () => !!ocbAddress && ocbAddress !== ZERO_ADDR,
        [ocbAddress]
    );

    async function handleOCBAddress() {
        if (!isAddress(ocbAddressInput)) {
            alert("not a valid address");
            return;
        }

        try {
            const txHash = await writeContract(config, {
                abi: testFactory.abi,
                address: testFactory.address,
                functionName: "setOCBAddress",
                args: [ocbAddressInput],
            });

            console.log("setOCBAddress TX:", txHash);

            // ✅ wait until mined
            await waitForTransactionReceipt(config, { hash: txHash });

            console.log("Transaction confirmed, refetching...");
            await refetchData();

        } catch (err) {
            console.error("Error setting OCB address:", err);
        }
    }

    async function handleFeeReceiverAddress() {
        if (!isAddress(feeReceiverAddressInput)) {
            alert("not a valid address");
            return;
        }

        try {
            const txHash = await writeContract(config, {
                abi: testFactory.abi,
                address: testFactory.address,
                functionName: "setFeeReceiver",
                args: [feeReceiverAddressInput],
            });

            console.log("setFeeReceiver TX:", txHash);

            // ✅ wait until mined
            await waitForTransactionReceipt(config, { hash: txHash });

            console.log("Transaction confirmed, refetching...");
            await refetchData();

        } catch (err) {
            console.error("Error setting OCB address:", err);
        }
    }



    return (
        <div className="h-full lg:w-1/2 rounded-2xl border-1 flex flex-col items-center justify-center gap-4 p-4">
            <div className='flex gap-2 items-center'>
                <h1 className="font-[AeonikFono] font-medium text-2xl uppercase col-span-2">Factory Set Up</h1>
                <button className='btn btn-secondary btn-sm font-medium' onClick={refetchData}>
                    refetch
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-ccw-icon lucide-refresh-ccw"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                </button>
            </div>
            <div className="w-full grid grid-cols-2 gap-2">

                <div className="w-full flex flex-col gap-2 border-1 p-4 rounded-2xl col-span-2">
                    <div className="flex justify-between">
                        <p className="font-['AeonikFono'] ">Set OCB Address</p>
                        <div className='flex gap-2'>
                            <p>
                                already set:
                            </p>

                            {isOcbSet ? (
                                <p className="badge badge-success font-black">yes</p>
                            ) : (
                                <p className="badge badge-error font-black">no</p>
                            )}
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="address"
                            value={ocbAddressInput}
                            onChange={(e) => setOcbAddressInput(e.target.value)}
                        />
                        <button className='btn btn-info' disabled={!isAddress(ocbAddressInput)} onClick={handleOCBAddress}>set address</button>
                    </div>
                </div>
                <div className="w-full flex flex-col gap-2 border-1 p-4 rounded-2xl col-span-2">
                    <div className="flex justify-between">
                        <p className="font-['AeonikFono'] ">Set Fee Receiver</p>

                        <div className='flex gap-2'>
                            <p>
                                already set:
                            </p>
                            {isFeeReceiverSet ? (
                                <p className="badge badge-success font-black">yes</p>
                            ) : (
                                <p className="badge badge-error font-black">no</p>
                            )}
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="address"
                            value={feeReceiverAddressInput}
                            onChange={(e) => setFeeReceiverAddressInput(e.target.value)}
                        />
                        <button className='btn btn-info' disabled={!isAddress(feeReceiverAddressInput)} onClick={handleFeeReceiverAddress}>set address</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminSetUp;
