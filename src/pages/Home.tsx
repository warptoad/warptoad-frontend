import { useEffect, useRef, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { isAddress, getAddress, erc20Abi, erc721Abi, formatEther, formatUnits, parseEther, parseEventLogs } from "viem";
import { getBalance, readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { testNFT } from "../components/Admin/Test/TestOCBMockConfig";
import { pairContractAbi } from "../abis/PairContractAbi";
import { config } from "../config/wagmiConfig";
import { CustomConnectKitButton } from "../components/CustomConnectKitButton";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as const;

type tokenInfo = {
    tokenAddress: string;
    tokenTicker: string;
    pairs: number[];
}

type connectedTokenInfo = {
    tokenPairAddress: string;
    connectedTokenAddress: string;
    connectedTokenTicker: string;
    connectedTokenIsOffer: boolean;
}

type currentOfferPayload = {
    tokenPairAddress: string;
    swapDirection: boolean;
    amountOffered: number;
    amountRequested: number;
    deadline: number;
    privateTaker: string | null;
}

type timeObject = {
    seconds: number;
    title: string;
}

const oneHourInSeconds = 3600;

const deadLineTimes: timeObject[] = [
    {
        seconds: oneHourInSeconds,
        title: "1 hour"
    },
    {
        seconds: oneHourInSeconds * 3,
        title: "3 hours"
    },
    {
        seconds: oneHourInSeconds * 12,
        title: "12 hours"
    },
    {
        seconds: oneHourInSeconds * 24,
        title: "1 day"
    },
    {
        seconds: oneHourInSeconds * 24 * 3,
        title: "3 days"
    },
    {
        seconds: oneHourInSeconds * 24 * 7,
        title: "1 week"
    },
    {
        seconds: oneHourInSeconds * 24 * 7 * 4,
        title: "1 month"
    },
]

//need to check if token OFFER is approved for amount, if not start approve MODAL


function Home() {
    const { address: userAddress, isConnected } = useAccount();
    const feeInfo = useRef<HTMLDialogElement>(null);
    const tokenSelection = useRef<HTMLDialogElement>(null);
    const [createdSlug, setCreatedSlug] = useState<string | null>(null);
    const [createOk, setCreateOk] = useState(false);

    const [allTokens, setAllTokens] = useState<tokenInfo[]>([])
    const [tokenABalance, setTokenABalance] = useState(0);
    const [tokenAInput, setTokenAInput] = useState(0);
    const [tokenAInputRaw, setTokenAInputRaw] = useState("");
    const [tokenAInfo, setTokenAInfo] = useState<tokenInfo | null>();
    const [connectedTokenInfo, setconnectedTokenInfo] = useState<connectedTokenInfo[] | null>(null);
    const [tokenBInput, setTokenBInput] = useState(0);
    const [tokenBInputRaw, setTokenBInputRaw] = useState("");
    const [tokenBInfo, setTokenBInfo] = useState<tokenInfo | null>();

    const [tokenPairAddress, setTokenPairAddress] = useState("");

    const [isPrivateOffer, setIsPrivateOffer] = useState(false);
    const [offerRecipient, setOfferRecipient] = useState("");
    const [activeToken, setActiveToken] = useState<string | null>(null);
    const [offerDeadline, setOfferDeadline] = useState(oneHourInSeconds * 24)
    const [allowanceSet, setAllowanceSet] = useState(false);

    const [isSwapped, setIsSwapped] = useState(false);


    async function checkAllowance() {
        if (!tokenAInfo || !tokenPairAddress || !userAddress) return

        if (tokenAInfo.tokenAddress === ZERO_ADDR) {
            setAllowanceSet(true)
            return
        }

        const tokenAAllowance = await readContract(config, {
            abi: erc20Abi,
            address: tokenAInfo.tokenAddress as `0x${string}`,
            functionName: "allowance",
            args: [userAddress, tokenPairAddress as `0x${string}`],
        }) as bigint;

        const parsedAmount = parseEther(tokenAInput.toString())
        setAllowanceSet(tokenAAllowance >= parsedAmount)
    }

    async function setAllowance() {
        if (!tokenAInfo || !tokenPairAddress || !userAddress || !tokenAInput || !tokenBInput) return
        const parsedAmount = parseEther(tokenAInput.toString())
        const txHash = await writeContract(config, {
            abi: erc20Abi,
            address: tokenAInfo.tokenAddress as `0x${string}`,
            functionName: "approve",
            args: [tokenPairAddress as `0x${string}`, parsedAmount],
        })
        await waitForTransactionReceipt(config, {
            hash: txHash,
        })
        await checkAllowance()
    }

    async function handleCreateOffer() {
        if (!tokenAInfo || !tokenPairAddress || !userAddress || !tokenAInput || !tokenBInput) return
        const parsedOfferAmount = parseEther(tokenAInput.toString());
        const parsedRequestAmount = parseEther(tokenBInput.toString())

        const createOfferParams: currentOfferPayload = {
            amountOffered: Number(parsedOfferAmount),
            amountRequested: Number(parsedRequestAmount),
            tokenPairAddress,
            swapDirection: isSwapped,
            deadline: Math.floor(Date.now() / 1000) + offerDeadline,
            privateTaker: (offerRecipient === ZERO_ADDR || offerRecipient === "") ? ZERO_ADDR : offerRecipient
        }

        const txHash = await writeContract(config, {
            abi: pairContractAbi.abi,
            address: createOfferParams.tokenPairAddress as `0x${string}`,
            functionName: "createOffer",
            args: [
                createOfferParams.swapDirection,
                createOfferParams.amountOffered,
                createOfferParams.amountRequested,
                createOfferParams.deadline,
                createOfferParams.privateTaker],
            value: tokenAInfo.tokenAddress === ZERO_ADDR ? parsedOfferAmount : 0n
        })

        const receipt = await waitForTransactionReceipt(config, { hash: txHash });
        const events = parseEventLogs({
            abi: pairContractAbi.abi,
            logs: receipt.logs,
            eventName: "OfferCreated" as const,
        });
        const offerEvent = events[0];
        //@ts-ignore
        const rawId = (offerEvent?.args as any)?.offerId ?? (offerEvent?.args as any)?.id;
        if (rawId === undefined) {
            console.error("Could not find offerId in logs. Check event name/args.");
            return;
        }

        const offerIdStr = (typeof rawId === "bigint" ? rawId.toString() : String(rawId));
        const slug = `${createOfferParams.tokenPairAddress}-${offerIdStr}`;

        // Update balances (your existing logic)
        if (tokenAInfo.tokenAddress === ZERO_ADDR) {
            await fetchEthBalance();
        } else {
            await fetchErc20Balance(tokenAInfo.tokenAddress as `0x${string}`);
        }

        // Show success UI with the proper slug
        setCreatedSlug(slug);
        setCreateOk(true);
    }

    const handleClick = async (tokenInfo: any) => {
        await handleSelectOfferToken(tokenInfo);
        setActiveToken(tokenInfo.tokenAddress);
    };

    async function fetchAllTokens() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/getAllTokens")
            const data: tokenInfo[] = await res.json();
            setAllTokens(data);

        } catch (error) {
            console.log(error);
        }
    }

    async function fetchConnectedTokens(address: string) {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/getAllTokenPairs/" + address)
            const data: connectedTokenInfo[] = await res.json();
            setconnectedTokenInfo(data);

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (isConnected) {
            fetchAllTokens()
        }
    }, [isConnected]);

    //@ts-ignore
    const { data: balance, isLoading, error } = useReadContract({
        abi: erc721Abi,
        address: testNFT.address,
        functionName: "balanceOf",
        args: [userAddress!],
        query: {
            enabled: !!userAddress,
        },
    });

    useEffect(() => {
        if (tokenAInput > 0) {
            checkAllowance()
        }

    }, [tokenAInput, tokenAInfo])


    useEffect(() => {
        if (!tokenAInfo) {
            return
        }
        if (tokenAInfo.tokenAddress === ZERO_ADDR) {
            fetchEthBalance();
        } else {
            fetchErc20Balance(tokenAInfo.tokenAddress as `0x${string}`);
        }
    }, [tokenAInfo])


    async function switchTokenDirection() {
        if ((!tokenAInfo || !tokenBInfo)) {
            return
        }

        setAllowanceSet(false)
        const tempTokenInfo = tokenAInfo;
        setTokenAInfo(tokenBInfo);
        setActiveToken(tokenBInfo.tokenAddress);
        handleSelectOfferToken(tokenBInfo);
        setTokenBInfo(tempTokenInfo);
        setIsSwapped(!isSwapped)
        await checkAllowance()
    }


    function formatBalanceNumber(num: number): string {
        if (num < 10) {
            return num.toFixed(2).replace(/\.?0+$/, ""); // max 2 decimals, trim trailing zeros
        }

        if (num < 1000) {
            return num.toFixed(2).replace(/\.?0+$/, ""); // integer only
        }

        const units = ["", "k", "m", "b", "t"];
        let unitIndex = 0;
        let n = num;

        while (n >= 1000 && unitIndex < units.length - 1) {
            n /= 1000;
            unitIndex++;
        }

        return n.toFixed(2) + units[unitIndex];
    }

    async function fetchEthBalance() {
        if (!userAddress) {
            return 0
        }
        const ethBalance = await getBalance(config, {
            address: userAddress,
        });

        setTokenABalance(Number(formatEther(ethBalance.value)))
    }

    function selectFullBalance() {
        setTokenAInput(tokenABalance);
        setTokenAInputRaw(tokenABalance.toString())
    }
    function selectHalfBalance() {
        setTokenAInput(tokenABalance / 2);
        setTokenAInputRaw((tokenABalance / 2).toString())
    }

    async function fetchErc20Balance(erc20Address: `0x${string}`) {
        if (!userAddress) {
            return 0;
        }

        // 1. read decimals
        const decimals = await readContract(config, {
            abi: erc20Abi,
            address: erc20Address,
            functionName: "decimals",
        }) as number;

        // 2. read balance
        const erc20Balance = await readContract(config, {
            abi: erc20Abi,
            address: erc20Address,
            functionName: "balanceOf",
            args: [userAddress],
        }) as bigint;

        // 3. format with correct decimals
        const formatted = formatUnits(erc20Balance, decimals);

        setTokenABalance(Number(formatted));
    }

    const handleTokenAInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(",", ".");
        if (!/^\d*(?:\.\d{0,18})?$/.test(v)) return;
        setTokenAInput(v === "" ? 0 : Number(v));
        setTokenAInputRaw(e.target.value);
    };

    const handleTokenBInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(",", ".");
        if (!/^\d*(?:\.\d{0,18})?$/.test(v)) return;
        setTokenBInput(v === "" ? 0 : Number(v));
        setTokenBInputRaw(e.target.value);
    };

    async function handleSelectOfferToken(currentTokenInfo: tokenInfo) {

        setTokenAInfo(currentTokenInfo);
        setTokenBInfo(null);
        await fetchConnectedTokens(currentTokenInfo.tokenAddress);

    }

    async function handleSelectRequestToken(connectedTokenAddress: string) {

        const ccurrentConnectedTokenInfo = allTokens.filter((v) => v.tokenAddress === connectedTokenAddress);
        if (!ccurrentConnectedTokenInfo[0]) {
            return
        }


        setTokenBInfo(ccurrentConnectedTokenInfo[0]);

        const dialog = document.getElementById("tokenSelection") as HTMLDialogElement | null;
        dialog?.close();

    }

    const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setOfferRecipient(value);
    };

    const isValidRecipient =
        offerRecipient !== "" &&
        isAddress(offerRecipient) &&
        getAddress(offerRecipient) !== ZERO_ADDR;

    const privateChecks = isPrivateOffer && isValidRecipient || !isPrivateOffer;


    return (
        <>
            {isConnected ? (
                <div className="p-2 md:p-0 h-full flex items-center justify-center" >
                    {!createOk ? (
                        <div className="w-full h-12/12 md:h-6/12 flex flex-col items-center justify-center p-2 gap-2">
                            <div className="w-full md:w-1/3 flex justify-between ">
                                <button className="btn btn-secondary rounded-xl">deposit</button>
                                <button className="btn btn-secondary rounded-xl btn-outline">withdraw</button>
                            </div>
                            <div className="md:w-1/3 border rounded-2xl flex flex-col items-center p-2 gap-2">
                                <div className="flex w-full justify-around gap-2 flex-grow flex-col relative">
                                    <div className="border rounded-2xl flex-1/3 p-2 flex flex-col gap-2 justify-between">
                                        <div className="flex gap-2 items-center">
                                            <p className="font-black">
                                                I offer
                                            </p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" inputMode="decimal" placeholder="0" value={tokenAInputRaw} onChange={handleTokenAInputChange} className="font-bold input input-xl input-secondary bg-base-200 w-full border-0  focus:outline-0 focus-within:outline-0  focus-visible:outline-0  rounded text-4xl " />
                                            {tokenAInfo ? (
                                                <button
                                                    onClick={() => {
                                                        const dialog = document.getElementById("tokenSelection") as HTMLDialogElement | null;
                                                        dialog?.showModal();
                                                    }}
                                                    className="btn btn-secondary btn-outline font-bold flex items-center p-1">
                                                    <img
                                                        src={"https://cdn.jsdelivr.net/gh/abashoverse/abasho-otc-tokens/" + import.meta.env.VITE_TOKEN_URL + `/${tokenAInfo.tokenAddress}.webp`}
                                                        alt="avatar"
                                                        className="w-8 h-8 rounded-full object-cover border"
                                                    />
                                                    <p>{tokenAInfo!.tokenTicker}</p>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="1rem"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="lucide lucide-chevron-down-icon lucide-chevron-down"
                                                    >
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const dialog = document.getElementById("tokenSelection") as HTMLDialogElement | null;
                                                        dialog?.showModal();
                                                    }}
                                                    className="btn btn-secondary btn-outline font-bold flex items-center px-2">
                                                    <p>Select</p>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="1rem"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="lucide lucide-chevron-down-icon lucide-chevron-down"
                                                    >
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex justify-end pb-4 md:pb-0">
                                            <div className="flex gap-2">
                                                <p>balance: {formatBalanceNumber(tokenABalance)}</p>
                                                <button className="btn btn-secondary btn-outline btn-xs" onClick={selectHalfBalance}>half</button>
                                                <button className="btn btn-secondary btn-outline btn-xs" onClick={selectFullBalance}>full</button>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={switchTokenDirection} className="btn btn-secondary btn-circle absolute justify-self-center self-center hover:rotate-180 transition-transform duration-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevrons-down-icon lucide-chevrons-down"><path d="m7 6 5 5 5-5" /><path d="m7 13 5 5 5-5" /></svg>
                                    </button>
                                    <div className="border rounded-2xl flex-1/3 p-2 flex flex-col gap-2 justify-between">
                                        <div className="flex gap-2 items-center">
                                            <p className="font-black">
                                                In return for
                                            </p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" inputMode="decimal" placeholder="0" value={tokenBInputRaw} onChange={handleTokenBInputChange} className="font-bold input input-xl input-secondary bg-base-200 w-full border-0  focus:outline-0 focus-within:outline-0  focus-visible:outline-0  rounded text-4xl " />

                                            {tokenBInfo ? (
                                                <button className="cursor-default btn btn-secondary btn-outline font-bold flex items-center p-1 pr-2">
                                                    <img
                                                        src={"https://cdn.jsdelivr.net/gh/abashoverse/abasho-otc-tokens/" + import.meta.env.VITE_TOKEN_URL + `/${tokenBInfo.tokenAddress}.webp`}
                                                        alt="avatar"
                                                        className="w-8 h-8 rounded-full object-cover border"
                                                    />
                                                    <p>{tokenBInfo.tokenTicker}</p>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const dialog = document.getElementById("tokenSelection") as HTMLDialogElement | null;
                                                        dialog?.showModal();
                                                    }}
                                                    className="btn btn-secondary btn-outline font-bold flex items-center px-2">
                                                    <p>Select</p>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="1rem"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="lucide lucide-chevron-down-icon lucide-chevron-down"
                                                    >
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex justify-start pb-4 md:pb-0">
                                            <div className="flex gap-2 text-sm font-medium">
                                                {Number(balance) >= 1 ? (
                                                    <button
                                                        className="btn btn-success btn-xs">
                                                        {Number(balance) >= 3 ? ("-0.15% fee") : ("-0.2% fee")}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-secondary btn-xs"
                                                        onClick={() => {
                                                            const dialog = document.getElementById("feeInfo") as HTMLDialogElement | null;
                                                            dialog?.showModal();
                                                        }}
                                                    >
                                                        -0.25% fee ?
                                                    </button>
                                                )}
                                                <dialog id="feeInfo" ref={feeInfo} className="modal">
                                                    <div className="modal-box bg-base-200 border rounded-md flex flex-col gap-6">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="font-black text-lg">Did you know?</h3>
                                                            <button onClick={() => {
                                                                const dialog = document.getElementById("feeInfo") as HTMLDialogElement | null;
                                                                dialog?.close();
                                                            }} className="btn btn-secondary btn-outline rounded">close</button>
                                                        </div>
                                                        <p className="py-4 font-bold">Holding OCBs supports the Abashoverse and lowers your fee!</p>
                                                        <div className="flex gap-4 justify-around w-full">
                                                            <a target="_blank" href="https://opensea.io/collection/ocb" className="btn btn-secondary flex-1/2">
                                                                View on OpenSea
                                                            </a>
                                                            <a target="_blank" href="https://magiceden.io/collections/abstract/0x5b720f0698547554ab1f7c127a2bda38391d1b4b" className="btn btn-secondary flex-1/2">
                                                                View on MagicEden
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <form method="dialog" className="modal-backdrop bg-base-200">
                                                        <button>close</button>
                                                    </form>
                                                </dialog>

                                                {/*TOKEN SELECTION*/}
                                                <dialog id="tokenSelection" ref={tokenSelection} className="modal">
                                                    <div className="modal-box bg-secondary rounded-md p-2 h-3/5 flex flex-col max-w-full lg:max-w-1/2">
                                                        <h1 className="font-black text-base-200 py-2 text-center">select a token pair</h1>
                                                        <div className="flex flex-col lg:flex-row flex-grow gap-2 h-full min-h-0">
                                                            <div className="bg-base-200 basis-1/2 max-h-1/2 lg:max-h-full p-2 rounded flex flex-col gap-2">
                                                                <div className="rounded p-2 border overflow-y-auto min-h-[100%] max-h-[10] flex flex-col gap-2">
                                                                    <h1 className="font-black text-center w-fit rounded-full p-1 px-2 bg-secondary text-base-200">offer</h1>
                                                                    {allTokens.map((tokenInfo) => (
                                                                        <button key={tokenInfo.tokenAddress}
                                                                            onClick={() => handleClick(tokenInfo)}
                                                                            className={`btn border rounded-full p-1 pl-2 flex items-center justify-between ${activeToken === tokenInfo.tokenAddress
                                                                                ? "btn-secondary" // active style
                                                                                : "btn-secondary btn-outline" // default style
                                                                                }`}
                                                                        >
                                                                            <p className="text-2xl font-black">
                                                                                {tokenInfo.tokenTicker}
                                                                            </p>
                                                                            <img
                                                                                src={"https://cdn.jsdelivr.net/gh/abashoverse/abasho-otc-tokens/" + import.meta.env.VITE_TOKEN_URL + `/${tokenInfo.tokenAddress}.webp`}
                                                                                alt="avatar"
                                                                                className="h-full rounded-full object-cover border"
                                                                            />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="bg-base-200 basis-1/2 max-h-1/2 lg:max-h-full p-2 rounded flex flex-col gap-2">
                                                                {/*<input type="text" placeholder="search" value={offerRecipient} onChange={handleRecipientChange} className="input input-secondary bg-base-200 rounded" />*/}
                                                                <div className="rounded p-2 border overflow-y-auto min-h-[100%] flex flex-col gap-2">
                                                                    <h1 className="font-black text-center w-fit rounded-full p-1 px-2 bg-secondary text-base-200">request</h1>
                                                                    {Array.isArray(connectedTokenInfo) && connectedTokenInfo.length > 0 ? (
                                                                        connectedTokenInfo!.map((item) => (
                                                                            <button
                                                                                onClick={async () => {
                                                                                    handleSelectRequestToken(item.connectedTokenAddress)
                                                                                    setTokenPairAddress(item.tokenPairAddress)
                                                                                    setIsSwapped(!item.connectedTokenIsOffer)
                                                                                }}
                                                                                key={item.tokenPairAddress} // or another stable id
                                                                                className="btn btn-secondary btn-outline border rounded-full p-1 pl-2 flex items-center justify-between"
                                                                            >
                                                                                <p className="text-2xl font-black">
                                                                                    {item.connectedTokenTicker ?? '—'}
                                                                                </p>
                                                                                <img
                                                                                    src={"https://cdn.jsdelivr.net/gh/abashoverse/abasho-otc-tokens/" + import.meta.env.VITE_TOKEN_URL + `/${item.connectedTokenAddress}.webp`}
                                                                                    alt="token"
                                                                                    className="h-full rounded-full object-cover border"
                                                                                />
                                                                            </button>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-center">select a token to offer first</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <form method="dialog" className="modal-backdrop bg-base-200">
                                                        <button>close</button>
                                                    </form>
                                                </dialog>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full flex justify-between items-center gap-2">
                                    <input type="text" placeholder="recipient" disabled={!isPrivateOffer} value={offerRecipient} onChange={handleRecipientChange} className="input input-secondary bg-base-200 disabled:bg-secondary flex-grow transition-colors duration-400" />
                                    <div className="flex gap-2 p-2 border rounded-4xl">
                                        <input
                                            type="checkbox"
                                            className="toggle border text-secondary checked:bg-secondary checked:text-base-200"
                                            onChange={() => { setIsPrivateOffer(!isPrivateOffer) }}
                                        />
                                        <p className="font-medium">private</p>
                                    </div>
                                </div>

                                <div className="w-full gap-2 flex">
                                    <details className="dropdown dropdown-top w-4/12">
                                        <summary className="btn btn-secondary btn-outline flex gap-2 p-2 rounded-4xl">
                                            <p>{deadLineTimes.filter((x) => x.seconds === offerDeadline)[0].title}</p>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="1rem"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="lucide lucide-chevron-down-icon lucide-chevron-down"
                                            >
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </summary>
                                        <ul className="menu dropdown-content bg-base-200 border rounded-2xl z-1 p-2 w-full flex gap-2">
                                            {deadLineTimes
                                                .map((deadline) => (
                                                    <li key={deadline.seconds}>
                                                        <button
                                                            className={
                                                                offerDeadline === deadline.seconds
                                                                    ? "btn btn-secondary"
                                                                    : "btn btn-secondary btn-outline"
                                                            }
                                                            onClick={(e) => {
                                                                setOfferDeadline(deadline.seconds);;
                                                                (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                                                            }}
                                                        >
                                                            {deadline.title}
                                                        </button>
                                                    </li>
                                                ))
                                                .reverse()}
                                        </ul>
                                    </details>

                                    {allowanceSet ? (
                                        <button onClick={handleCreateOffer} className="btn btn-secondary flex-grow" disabled={!privateChecks || tokenAInput <= 0 || tokenBInput <= 0}>
                                            Create Offer
                                        </button>
                                    ) : (
                                        <button onClick={setAllowance} className="btn btn-secondary flex-grow" disabled={!privateChecks || tokenAInput <= 0 || tokenBInput <= 0}>
                                            Approve First
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-2xl flex flex-col items-center p-8 md:px-16">
                            <div className="w-full h-full flex justify-between items-center flex-col gap-4">
                                <h1 className="text-center text-2xl font-bold">
                                    Offer Successfully Created!
                                </h1>
                                <button
                                    className="w-full btn btn-secondary border p-2 px-4 rounded-full flex justify-center gap-2"
                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/otc-deals/${createdSlug}`)}
                                >
                                    <p className="truncate max-w-[200px] sm:max-w-full"
                                    >{`${window.location.origin}/otc-deals/${createdSlug}`}</p>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                </button>
                                <div className="w-full flex gap-2">
                                    <a className="btn btn-secondary btn-outline flex-1/2" href="/otc-create">Create Offer</a>
                                    <a className="btn btn-secondary btn-outline flex-1/2" href={`/otc-deals/${createdSlug}`}>View Offer</a>
                                </div>
                            </div>
                        </div>
                    )
                    }
                </div >
            ) : (
                <div className="w-full h-full flex justify-center items-center">
                    <CustomConnectKitButton />
                </div>
            )}
        </>
    )
}

export default Home
