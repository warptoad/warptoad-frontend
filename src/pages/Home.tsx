import { useEffect, useRef, useState, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { isAddress, getAddress, erc20Abi, erc721Abi, formatEther, formatUnits, parseEther, parseEventLogs } from "viem";
//@ts-ignore
import { getBalance, readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useWalletClient } from 'wagmi'
import { BrowserProvider } from 'ethers'
import { testNFT } from "../components/Admin/Test/TestOCBMockConfig";
import { config } from "../config/wagmiConfig";
import { CustomConnectKitButton } from "../components/CustomConnectKitButton";
import { useAzguard } from "../Context/AzguardContext";
import l1Addresses from "../components/artifacts/chain-11155111/deployed_addresses.json";
import l2Addresses from "../components/artifacts/chain-534351/deployed_addresses.json"
import { abi as warptoadAbi } from "../components/artifacts/chain-11155111/artifacts/L1WarpToadModuleL1WarpToad.json";

import { WarpToadCoreContractArtifact, WarpToadCoreContract } from "@warp-toad/backend/aztec/WarpToadCore";
import { GigaBridge__factory } from "@warp-toad/backend/ethers/typechain-types";


import { getContractAddressesAztec, getContractAddressesEvm, evmDeployments } from "warp-toad-old-backend/deployment";
import { SEPOLIA_CHAINID, SCROLL_CHAINID_SEPOLIA } from "warp-toad-old-backend/constants";
import { EVM_TREE_DEPTH, gasCostPerChain } from "warp-toad-old-backend/constants";
import { hashCommitment, hashPreCommitment } from "warp-toad-old-backend/hashing";
import { calculateFeeFactor, createProof, getMerkleData, getProofInputs } from "warp-toad-old-backend/proving";
import { sendGigaRoot, bridgeAZTECLocalRootToL1, parseEventFromTx, updateGigaRoot, receiveGigaRootOnAztec, bridgeBetweenL1AndL2 } from "warp-toad-old-backend/bridging";

import { getL1Contracts, getL2Contracts, getAztecTestWallet } from 'warp-toad-old-backend/deployment';
import { getLocalRootProviders, getPayableGigaRootRecipients, sleep } from 'warp-toad-old-backend/bridging';

import { UltraHonkBackend, UltraPlonkBackend } from "@aztec/bb.js";
import { createPreCommitment, getChainIdAztecFromContract } from "../components/utils/depositFunctionality";
import { AzguardClient } from "@azguardwallet/client";
import type { SimulateViewsResult } from "@azguardwallet/types";


const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as const;

type ChainInfo = {
    chainType: "EVM" | "AZTEC";
    chainName: "Mainnet" | "SCROLL" | "AZTEC";
    chainId: "11155111" | "534351" | "aztec:11155111" | "aztec:31337";  //534351 scroll | "aztec:11155111" aztec testnet | "aztec:31337" - sandbox
}

type TokenInfo = {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
}

type TokenPick = {
    chain: ChainInfo;
    token: TokenInfo;
}

type TokenSelection = {
    chain: ChainInfo;
    chainTokens: TokenInfo[];
};


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

type DepositPayload = {
    amount: number;
    tokenAddress: string;
    originChain: string;
    destinationChain: string;
    destinationWallet: string;
}

type DestinationWallet = {
    chainType: "AZTEC" | "EVM";
    address: string;
}


//need to check if token OFFER is approved for amount, if not start approve MODAL

const mockFetchData: TokenSelection[] = [
    {
        chain: {
            chainId: "11155111", //sepolia / ?Mainnet?
            chainType: "EVM",
            chainName: "Mainnet",
        },
        chainTokens: [
            {
                tokenAddress: l1Addresses["TestToken#USDcoin"],
                tokenName: "USD Coin",
                tokenSymbol: "USDC",
            }
        ]
    }, {
        chain: {
            chainId: "534351", //scroll
            chainType: "EVM",
            chainName: "SCROLL",
        },
        chainTokens: [
            {
                tokenAddress: l2Addresses["L2ScrollModule#L2WarpToad"],
                tokenName: "USD Coin",
                tokenSymbol: "USDC",
            }
        ]
    },
    {
        chain: {
            chainId: "aztec:11155111",
            chainType: "AZTEC",
            chainName: "AZTEC",
        },
        chainTokens: [
            {
                tokenAddress: "",
                tokenName: "USD Coin",
                tokenSymbol: "USDC",
            }
        ]
    }
]


const shorten = (input?: string | null) => {
    if (!input) return "";
    const addr = input.includes("0x") ? input.slice(input.indexOf("0x")) : input;
    return addr.length <= 10 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};


function Home() {
    const { address: userEVMAddress, isConnected, connector } = useAccount();
    const { address: userAztecAddress, client: azguardClient } = useAzguard();

    const originSelectionModal = useRef<HTMLDialogElement>(null);
    const destinationSelectionModal = useRef<HTMLDialogElement>(null);
    const destinationAddressModal = useRef<HTMLDialogElement>(null);
    const [createdSlug, setCreatedSlug] = useState<string | null>(null);
    const [createOk, setCreateOk] = useState(false);

    const [destinationWalletAddress, setDestinationWalletAddress] = useState<DestinationWallet | null>();


    const [originChainPick, setOriginChainPick] = useState<ChainInfo | null>(null);
    const [originTokenPick, setOriginTokenPick] = useState<TokenInfo | null>(null);

    const [destinationChainPick, setDestinationChainPick] = useState<ChainInfo | null>(null);
    const [destinationTokenPick, setDestinationTokenPick] = useState<TokenInfo | null>(null);



    const [destinationSelection, setDestinationSelection] = useState<TokenInfo[] | null>(null);
    const [originTokenSelection, setOriginTokenSelection] = useState<TokenInfo[] | null>(null);

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
    const [allowanceSet, setAllowanceSet] = useState(false);

    const [isSwapped, setIsSwapped] = useState(false);

    function displayAddressFromChainType(chainInfo: ChainInfo | null) {

        if (!chainInfo) {
            return "none"
        }
        if (chainInfo.chainType === "AZTEC") {
            return shorten(userAztecAddress)
        }
        if (chainInfo.chainType === "EVM") {
            return shorten(userEVMAddress)
        }
        else {
            return "select"
        }

    }

    async function handleBridgeOnL1() {
        if (!originTokenPick) return
        /**
         * WRAP TOKENS
         */
        /*
                const decimals = await readContract(config, {
                    abi: erc20Abi,
                    address: originTokenPick.tokenAddress as `0x${string}`,
                    functionName: "decimals",
                }) as number;
        
                const amount = BigInt(tokenAInput*10**decimals)
        
                const txHashWrap = await writeContract(config, {
                    abi: warptoadAbi,
                    address: l1Addresses["L1WarpToadModule#L1WarpToad"] as `0x${string}`,
                    functionName: "wrap",
                    args: [amount],
                })
        
                console.log(txHashWrap);
        */




        if (!azguardClient) return;

        const chainsen = (await getContractAddressesAztec(11155111n)).AztecWarpToad
        console.log(chainsen)

        const account = azguardClient.accounts[0];
        const address = account.split(":").at(-1);
        console.log("waa")

        const contractInstance = await WarpToadCoreContract.at(chainsen, azguardClient);

        const [
            registerContractResult,
        ] = await azguardClient.execute([
            {
                kind: "register_contract",
                chain: "aztec:11155111",
                address: chainsen,
                instance: WarpToadCoreContract.at(),
                artifact: WarpToadCoreContractArtifact,
            }
        ]);
        console.log("watero")
        console.log(account)
        const wat = (registerContractResult.status)
        console.log(wat)


        //await getChainIdAztecFromContract()

        //const preImg = createPreCommitment(amount, );

    }

    function showRemainingChainsForDestination() {

        if (originChainPick) {
            const filtered = mockFetchData.filter(
                (selection) => selection.chain.chainId !== originChainPick.chainId);
            return filtered
        }

        return mockFetchData
    }

    function showRemainingChainsForOrigin() {
        if (destinationChainPick) {
            const filtered = mockFetchData.filter(
                (selection) => selection.chain.chainId !== destinationChainPick.chainId);
            return filtered
        }

        return mockFetchData
    }


    async function checkAllowance() {
        if (!originTokenPick || !userEVMAddress) return

        const tokenAAllowance = await readContract(config, {
            abi: erc20Abi,
            address: originTokenPick.tokenAddress as `0x${string}`,
            functionName: "allowance",
            args: [userEVMAddress, l1Addresses["L1InfraModule#L1WarpToad"] as `0x${string}`],
        }) as bigint;

        const decimals = await readContract(config, {
            abi: erc20Abi,
            address: originTokenPick.tokenAddress as `0x${string}`,
            functionName: "decimals",
        }) as number;

        const parsedAmount = tokenAInput * 10 ** decimals;
        setAllowanceSet(tokenAAllowance >= parsedAmount)
    }

    async function setAllowance() {
        if (!originTokenPick || !userEVMAddress || !tokenAInput) return

        const decimals = await readContract(config, {
            abi: erc20Abi,
            address: originTokenPick.tokenAddress as `0x${string}`,
            functionName: "decimals",
        }) as number;

        const parsedAmount = tokenAInput * 10 ** decimals;
        console.log(parsedAmount);

        const txHash = await writeContract(config, {
            abi: erc20Abi,
            address: originTokenPick.tokenAddress as `0x${string}`,
            functionName: "approve",
            args: [l1Addresses["L1InfraModule#L1WarpToad"] as `0x${string}`, BigInt(parsedAmount)],
        })
        await waitForTransactionReceipt(config, {
            hash: txHash,
        })
        await checkAllowance()
    }

    // async function handleCreateOffer() {
    //     if (!tokenAInfo || !tokenPairAddress || !userEVMAddress || !tokenAInput || !tokenBInput) return
    //     const parsedOfferAmount = parseEther(tokenAInput.toString());
    //     const parsedRequestAmount = parseEther(tokenBInput.toString())

    //     const createOfferParams: currentOfferPayload = {
    //         amountOffered: Number(parsedOfferAmount),
    //         amountRequested: Number(parsedRequestAmount),
    //         tokenPairAddress,
    //         swapDirection: isSwapped,
    //         deadline: 1000,
    //         privateTaker: (offerRecipient === ZERO_ADDR || offerRecipient === "") ? ZERO_ADDR : offerRecipient
    //     }

    //     const txHash = await writeContract(config, {
    //         abi: pairContractAbi.abi,
    //         address: createOfferParams.tokenPairAddress as `0x${string}`,
    //         functionName: "createOffer",
    //         args: [
    //             createOfferParams.swapDirection,
    //             createOfferParams.amountOffered,
    //             createOfferParams.amountRequested,
    //             createOfferParams.deadline,
    //             createOfferParams.privateTaker],
    //         value: tokenAInfo.tokenAddress === ZERO_ADDR ? parsedOfferAmount : 0n
    //     })

    //     const receipt = await waitForTransactionReceipt(config, { hash: txHash });
    //     const events = parseEventLogs({
    //         abi: pairContractAbi.abi,
    //         logs: receipt.logs,
    //         eventName: "OfferCreated" as const,
    //     });
    //     const offerEvent = events[0];
    //     //@ts-ignore
    //     const rawId = (offerEvent?.args as any)?.offerId ?? (offerEvent?.args as any)?.id;
    //     if (rawId === undefined) {
    //         console.error("Could not find offerId in logs. Check event name/args.");
    //         return;
    //     }

    //     const offerIdStr = (typeof rawId === "bigint" ? rawId.toString() : String(rawId));
    //     const slug = `${createOfferParams.tokenPairAddress}-${offerIdStr}`;

    //     // Update balances (your existing logic)
    //     await fetchErc20Balance(originTokenPick?.tokenAddress as `0x${string}`);

    //     // Show success UI with the proper slug
    //     setCreatedSlug(slug);
    //     setCreateOk(true);
    // }

    const handleClick = async (tokenInfo: any) => {
        await handleSelectOfferToken(tokenInfo);
        setActiveToken(tokenInfo.tokenAddress);
    };


    async function fetchConnectedTokens(address: string) {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/getAllTokenPairs/" + address)
            const data: connectedTokenInfo[] = await res.json();
            setconnectedTokenInfo(data);

        } catch (error) {
            console.log(error);
        }
    }

    //@ts-ignore
    const { data: balance, isLoading, error } = useReadContract({
        abi: erc721Abi,
        address: testNFT.address,
        functionName: "balanceOf",
        args: [userEVMAddress!],
        query: {
            enabled: !!userEVMAddress,
        },
    });


    async function skibidiy() {
        console.log(getProofInputs.arguments);
        console.log(await getContractAddressesAztec(SEPOLIA_CHAINID))
    }

    useEffect(() => {
        skibidiy()
    }, [])

    useEffect(() => {
        if (tokenAInput > 0) {
            checkAllowance()
        }

    }, [tokenAInput, originTokenPick])


    useEffect(() => {
        if (!originTokenPick) {
            return
        }
        fetchErc20Balance(originTokenPick?.tokenAddress as `0x${string}`);
    }, [originTokenPick])


    async function switchChainPickDirection() {
        if ((!originChainPick || !destinationChainPick)) {
            return
        }

        const tempChainPick = originChainPick;
        setOriginChainPick(destinationChainPick);
        setDestinationChainPick(tempChainPick);
        setIsSwapped(!isSwapped)
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

    function selectFullBalance() {
        setTokenAInput(tokenABalance);
        setTokenAInputRaw(tokenABalance.toString())
    }
    function selectHalfBalance() {
        setTokenAInput(tokenABalance / 2);
        setTokenAInputRaw((tokenABalance / 2).toString())
    }

    async function fetchErc20Balance(erc20Address: `0x${string}`) {
        if (!userEVMAddress) {
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
            args: [userEVMAddress],
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
                                        <div className="flex gap-2 items-center justify-between">
                                            <p className="font-black">
                                                Origin
                                            </p>
                                            <button
                                                className="btn btn-secondary btn-outline btn-xs font-bold flex items-center px-4">
                                                <p>{displayAddressFromChainType(originChainPick)}</p>
                                            </button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" inputMode="decimal" placeholder="0" value={tokenAInputRaw} onChange={handleTokenAInputChange} className="font-bold input input-xl input-secondary bg-base-200 w-full border-0  focus:outline-0 focus-within:outline-0  focus-visible:outline-0  rounded text-4xl " />
                                            {originChainPick && originTokenPick ? (


                                                <button
                                                    onClick={() => {
                                                        const dialog = document.getElementById("originSelectionModal") as HTMLDialogElement | null;
                                                        dialog?.showModal();
                                                    }}
                                                    className="btn btn-secondary btn-outline font-bold flex items-center justify-start p-1">
                                                    <div className="w-8 h-8 relative">
                                                        <img
                                                            src={`/tokens/${originTokenPick?.tokenSymbol.toLowerCase()}.png`}
                                                            alt="avatar"
                                                            className="rounded-full object-cover border"
                                                        />
                                                        <img src={`/chains/${originChainPick?.chainName.toLowerCase()}.png`} alt="" className="w-2/5 absolute bottom-0 right-0" />
                                                    </div>
                                                    <div className="flex flex-col text-start">
                                                        <p className="text-xs font-black">{originTokenPick?.tokenSymbol}</p>
                                                        <p className="text-xs font-medium">{originChainPick?.chainName.toLowerCase()}</p>
                                                    </div>
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
                                                        const dialog = document.getElementById("originSelectionModal") as HTMLDialogElement | null;
                                                        dialog?.showModal();
                                                    }}
                                                    className="btn btn-secondary btn-outline font-bold flex items-center justify-start p-1">
                                                    <p className="pl-2">Select</p>
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
                                    <button onClick={switchChainPickDirection} className="btn btn-secondary btn-circle absolute justify-self-center self-center hover:rotate-180 transition-transform duration-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevrons-down-icon lucide-chevrons-down"><path d="m7 6 5 5 5-5" /><path d="m7 13 5 5 5-5" /></svg>
                                    </button>
                                    <div className="border rounded-2xl flex-1/3 p-2 flex flex-col gap-2 justify-between">
                                        <div className="flex gap-2 items-center justify-between">
                                            <p className="font-black basis-1/2">
                                                Destination
                                            </p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" disabled inputMode="decimal" placeholder="0" value={tokenAInputRaw} className="font-bold input input-xl input-secondary bg-base-200 w-full border-0  focus:outline-0 focus-within:outline-0  focus-visible:outline-0  rounded text-4xl " />

                                            {destinationChainPick ? (
                                                <button
                                                    onClick={() => {
                                                        const dialog = document.getElementById("destinationSelectionModal") as HTMLDialogElement | null;
                                                        dialog?.showModal();
                                                    }}
                                                    className="btn btn-secondary btn-outline font-bold flex items-center justify-start p-1">
                                                    <div className="w-8 h-8 relative">
                                                        <img
                                                            src={`/tokens/${originTokenPick?.tokenSymbol.toLowerCase()}.png`}
                                                            alt="avatar"
                                                            className="rounded-full object-cover border"
                                                        />
                                                        <img src={`/chains/${destinationChainPick?.chainName.toLowerCase()}.png`} alt="" className="w-2/5 absolute bottom-0 right-0" />
                                                    </div>
                                                    <div className="flex flex-col text-start">
                                                        <p className="text-xs font-black">{destinationTokenPick?.tokenSymbol}</p>
                                                        <p className="text-xs font-medium">{destinationChainPick?.chainName.toLowerCase()}</p>
                                                    </div>
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
                                                        const dialog = document.getElementById("destinationSelectionModal") as HTMLDialogElement | null;
                                                        dialog?.showModal();
                                                    }}
                                                    disabled={originTokenPick === null}
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

                                                {/*Origin SELECTION*/}
                                                <dialog id="originSelectionModal" ref={originSelectionModal} className="modal">
                                                    <div className="modal-box bg-base-200 border rounded-xl p-2 h-3/5 flex flex-col gap-2 max-w-full lg:max-w-1/2">
                                                        <div className="flex justify-between">
                                                            <h3 className="font-black text-lg">Select Token</h3>
                                                            <button
                                                                onClick={() => {
                                                                    const dialog = document.getElementById("originSelectionModal") as HTMLDialogElement | null;
                                                                    dialog?.close();
                                                                }}
                                                                className="btn btn-secondary btn-outline btn-xs">close</button>
                                                        </div>
                                                        <div className="flex flex-grow gap-2">
                                                            <div className="border basis-1/3 p-2 rounded-xl flex flex-col">
                                                                <p className="font-black pb-2">Chain</p>
                                                                <div className="flex flex-col flex-grow gap-2">
                                                                    {showRemainingChainsForOrigin().map((item) => (
                                                                        <button
                                                                            key={item.chain.chainName}
                                                                            onClick={() => {
                                                                                setOriginTokenSelection(item.chainTokens);
                                                                                setOriginChainPick(item.chain);
                                                                            }}
                                                                            className={`btn btn-primary ${item.chain.chainName == originChainPick?.chainName ? "" : "btn-ghost"} h-fit w-full p-2 flex justify-start items-center gap-2 rounded`}>
                                                                            <img src={`/chains/${item.chain.chainName.toLowerCase()}.png`} alt={`${item.chain.chainName} Logo`} className="w-8 h-8 aspect-square" />
                                                                            <p>{item.chain.chainName}</p>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="border flex-grow p-2 rounded-xl flex flex-col">
                                                                <p className="font-black">Token</p>
                                                                <div className="flex flex-col flex-grow gap-2">
                                                                    {
                                                                        (originTokenSelection && originChainPick) ? (

                                                                            originTokenSelection.map((token) => (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setOriginTokenPick(token);
                                                                                        const dialog = document.getElementById("originSelectionModal") as HTMLDialogElement | null;
                                                                                        dialog?.close();
                                                                                    }}
                                                                                    key={token.tokenName}
                                                                                    className="btn btn-primary btn-ghost h-fit w-full p-2 flex justify-start items-center gap-2 rounded">
                                                                                    <div className="relative w-8 h-8 aspect-square">
                                                                                        <img src={`/tokens/${token.tokenSymbol.toLowerCase()}.png`} alt="token Logo" className="" />
                                                                                        <img src={`/chains/${originChainPick.chainName.toLowerCase()}.png`} alt="" className="absolute w-2/5 bottom-0 right-0" />
                                                                                    </div>
                                                                                    <div className="flex flex-col items-start ">
                                                                                        <p className="text-md font-bold">{token.tokenSymbol}</p>
                                                                                        <p className="text-xs font-normal">{token.tokenName}</p>
                                                                                    </div>
                                                                                </button>
                                                                            ))
                                                                        ) : (
                                                                            <p>select a chain</p>
                                                                        )
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <form method="dialog" className="modal-backdrop bg-base-200">
                                                        <button>close</button>
                                                    </form>
                                                </dialog>

                                                {/* Destination selection */}
                                                <dialog id="destinationSelectionModal" ref={destinationSelectionModal} className="modal">
                                                    <div className="modal-box bg-base-200 border rounded-xl p-2 h-3/5 flex flex-col gap-2 max-w-full lg:max-w-1/2">
                                                        <div className="flex justify-between">
                                                            <h3 className="font-black text-lg">Select Destination</h3>
                                                            <button
                                                                onClick={() => {
                                                                    const dialog = document.getElementById("destinationSelectionModal") as HTMLDialogElement | null;
                                                                    dialog?.close();
                                                                }}
                                                                className="btn btn-secondary btn-outline btn-xs">close</button>
                                                        </div>
                                                        <div className="flex flex-grow gap-2">
                                                            <div className="border w-full p-2 rounded-xl flex flex-col">
                                                                <p className="font-black pb-2">Chain</p>
                                                                <div className="flex flex-col flex-grow gap-2">
                                                                    {showRemainingChainsForDestination().map((item) => (
                                                                        <button
                                                                            key={item.chain.chainName}
                                                                            onClick={() => {
                                                                                setDestinationChainPick(item.chain);
                                                                                const dialog = document.getElementById("destinationSelectionModal") as HTMLDialogElement | null;
                                                                                dialog?.close();
                                                                            }}
                                                                            className={`btn btn-primary ${item.chain.chainName == destinationChainPick?.chainName ? "" : "btn-ghost"} h-fit w-full p-2 flex justify-start items-center gap-2 rounded`}>
                                                                            <img src={`/chains/${item.chain.chainName.toLowerCase()}.png`} alt={`${item.chain.chainName} Logo`} className="w-8 h-8 aspect-square" />
                                                                            <p>{item.chain.chainName}</p>
                                                                        </button>
                                                                    ))}
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

                                <div className="w-full gap-2 flex">
                                    {allowanceSet ? (
                                        <button onClick={async () => {
                                            await handleBridgeOnL1();
                                        }} className="btn btn-secondary flex-grow" disabled={!privateChecks || tokenAInput <= 0 || !originChainPick || !destinationChainPick}>
                                            Create Offer
                                        </button>
                                    ) : (
                                        <button onClick={setAllowance} className="btn btn-secondary flex-grow" disabled={!privateChecks || tokenAInput <= 0}>
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
