import { useEffect, useRef, useState, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { isAddress, getAddress, erc20Abi, erc721Abi, formatEther, formatUnits, parseEther, parseEventLogs } from "viem";
//@ts-ignore
import { getBalance, readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useWalletClient } from 'wagmi'
import { BrowserProvider, JsonRpcProvider, toBeHex, toBigInt } from 'ethers'
import logo from "../assets/WarptoadLogo.svg";
import { testNFT } from "../components/Admin/Test/TestOCBMockConfig";
import { config } from "../config/wagmiConfig";
import { CustomConnectKitButton } from "../components/CustomConnectKitButton";
import { useAztecWallet } from "../Context/AztecWalletContext";
import { abi as warptoadAbi } from "../components/artifacts/chain-11155111/artifacts/L1WarpToadModuleL1WarpToad.json";

import { WarpToadCoreContractArtifact, WarpToadCoreContract } from "@warp-toad/backend/aztec/WarpToadCore";
import { L1WarpToad__factory, GigaBridge__factory, WarpToadCore__factory, type GigaBridge, type WarpToadCore, L2WarpToad__factory } from "@warp-toad/backend/ethers/typechain-types";
import { aztecDeployments } from "@warp-toad/backend/deployment"


import { getContractAddressesAztec, getContractAddressesEvm, evmDeployments, getSponsoredFPCInstance, getL2EvmContracts } from "@warp-toad/backend/deployment";
import { calculateFeeFactor, getMerkleData, getProofInputs } from "@warp-toad/backend/proving";
import { createPreCommitment, hashCommitment, loadNotes, saveNotes, updateNoteByIndex, type WarptoadNote, type WarptoadNoteStorageEntry } from "../components/utils/depositFunctionality";

import type { SimulateViewsResult } from "@azguardwallet/types";
import { AztecAddress, Contract, Fr, SponsoredFeePaymentMethod, type ContractInstanceWithAddress } from "@aztec/aztec.js";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import NoteInput from "../components/Input/NoteInput";
import { gasCostPerChain } from "@warp-toad/backend/constants";
import { poseidon1, poseidon3 } from "poseidon-lite";
import { useAzguard } from "../Context/AzguardContext";
import type { Key } from "react";


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
                tokenAddress: evmDeployments[11155111]["TestToken#USDcoin"],
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
                tokenAddress: evmDeployments[534351]["L2ScrollModule#L2WarpToad"],
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

const chainNames: Record<number, string> = {
    1: "Ethereum Mainnet",
    11155111: "Sepolia",
    534351: "Scroll",
};

function chainIdToString(chainId: bigint) {
    return chainNames[Number(chainId)] ?? `Aztec`;
}

function parseTokenWithdrawAmount(amount: bigint, chainId: bigint) {
    return chainIdToString(chainId) === "Aztec" ? Number(amount) / 10 ** 6 : Number(amount) / 10 ** 18
}


const bridgeStates = ["wrapping", "bridging", "bridging successful!"]

function Home() {
    const signer = useEthersSigner();
    const { address: userEVMAddress, isConnected, connector, chainId: chainIdEvm } = useAccount();
    //const { address: userAztecAddress, wallet: userAztecWallet, isConnected: aztecConnected, pxe, testMint } = useAztecWallet();
    const { isInstalled, isConnected: aztecConnected, address: userAztecAddress, connect, disconnect, wallet: userAztecWallet } = useAzguard();
    const originSelectionModal = useRef<HTMLDialogElement>(null);
    const destinationSelectionModal = useRef<HTMLDialogElement>(null);
    const destinationAddressModal = useRef<HTMLDialogElement>(null);
    const [createdSlug, setCreatedSlug] = useState<string | null>(null);
    const [isBridging, setIsBridging] = useState<number | undefined>(undefined);

    const [sponsoredFPCContract, setSponsoredFPCContract] = useState<SponsoredFPCContract | null>(null)
    const [sponsoredFPCInstance, setSponsoredFPC] = useState<ContractInstanceWithAddress | null>(null)

    const [isDeposit, setIsDeposit] = useState(true);

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
    const [activeToken, setActiveToken] = useState<string | null>(null);
    const [allowanceSet, setAllowanceSet] = useState(false);
    const [notes, setNotes] = useState<WarptoadNoteStorageEntry[]>([]);

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

    async function initSponsoredFPCContract() {
        //const sponsoredFPC = await getSponsoredFPCInstance();
        //setSponsoredFPC(sponsoredFPC);
        //setSponsoredFPCContract(await SponsoredFPCContract.at(sponsoredFPC.address, userAztecWallet))
    }

    useEffect(() => {
        initSponsoredFPCContract()
    }, [userAztecWallet]);

    useEffect(() => {
        setNotes(loadNotes())
    }, []);

    function downloadFile(data: WarptoadNote) {
        const timestamp = Date.now();
        const filename = `warptoad${timestamp}.txt`;

        // Convert BigInt to string for JSON
        const jsonString = JSON.stringify(
            data,
            (_, value) =>
                typeof value === "bigint" ? value.toString() : value,
            2,
        );

        const blob = new Blob([jsonString], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }

    async function getChainIdAztecFromContract() {
        if (!userAztecWallet) {
            console.warn('AZTEC wallet not connected');
            return;
        }

        const addresses = await getContractAddressesAztec(11155111n)
        const AztecWarpToadAddress = addresses.AztecWarpToad

        const AztecWarpToad = await Contract.at(
            AztecAddress.fromString(AztecWarpToadAddress),
            WarpToadCoreContractArtifact,
            userAztecWallet,
        );



        const aztecVersion = (await userAztecWallet.getNodeInfo()).rollupVersion;


        const chainIdAztecFromContract = BigInt(await AztecWarpToad.methods.get_chain_id_unconstrained(aztecVersion).simulate())
        console.log(chainIdAztecFromContract)
        return chainIdAztecFromContract
    }

    async function handleDeposit() {
        if (!originTokenPick) return

        if (originChainPick?.chainType === "EVM") {
            const aztecChainID = await getChainIdAztecFromContract();

            if (!aztecChainID) {
                console.log("ERROR GETTING AZTEC CHAIN ID");
                return;
            }

            setIsBridging(0);

            const decimals = await readContract(config, {
                abi: erc20Abi,
                address: originTokenPick.tokenAddress as `0x${string}`,
                functionName: "decimals",
            }) as number;

            const amount = BigInt(tokenAInput * 10 ** decimals)

            const noteData = await createPreCommitment(amount, aztecChainID)

            console.log(noteData)

            if (!noteData) return

            if (chainIdEvm === 11155111) {
                const txHashWrap = await writeContract(config, {
                    abi: warptoadAbi,
                    address: evmDeployments[chainIdEvm as number]["L1WarpToadModule#L1WarpToad"] as `0x${string}`,
                    functionName: "wrap",
                    args: [amount],
                    chainId: chainIdEvm as 11155111 | 534351 | undefined
                })

                console.log("submitted:", txHashWrap)

                // Wait until mined
                const receipt = await waitForTransactionReceipt(config, {
                    hash: txHashWrap,
                })

                console.log("confirmed:", receipt)
            }
            setIsBridging(1);

            //evmDeployments[chainIdEvm as number][chainIdEvm === 11155111 ? "L1InfraModule#L1WarpToad" : "L2ScrollModule#L2WarpToad"]
            const txHashBurn = await writeContract(config, {
                abi: L1WarpToad__factory.abi,
                address: evmDeployments[chainIdEvm as number][chainIdEvm === 11155111 ? "L1InfraModule#L1WarpToad" : "L2ScrollModule#L2WarpToad"] as `0x${string}`,
                functionName: "burn",
                args: [noteData?.preCommitment!, amount],
                chainId: chainIdEvm as 11155111 | 534351 | undefined
            })

            console.log("submitted:", txHashBurn)

            // Wait until mined
            const receiptBurn = await waitForTransactionReceipt(config, {
                hash: txHashBurn,
            })

            console.log("confirmed:", receiptBurn)

            setIsBridging(2);
            downloadFile(noteData);
            saveNotes([{
                isAvailable: true,
                note: noteData
            }])
            //update balance
            await fetchInputBalance(originTokenPick?.tokenAddress as `0x${string}`);

            setNotes(loadNotes())
        }
        if (originChainPick?.chainType === "AZTEC") {
            if (!destinationChainPick) return

            console.log("starting aztec stuff");
            setIsBridging(0);
            const bridgeAmount = BigInt(tokenAInput * 10 ** 18)

            const chainIdUsed = BigInt(Number(destinationChainPick.chainId))

            const noteData = await createPreCommitment(bridgeAmount, chainIdUsed)

            if (!userAztecWallet) return;

            const addresses = await getContractAddressesAztec(11155111n)
            const AztecWarpToadAddress = addresses.AztecWarpToad

            const AztecWarpToad = await Contract.at(
                AztecAddress.fromString(AztecWarpToadAddress),
                WarpToadCoreContractArtifact,
                userAztecWallet,
            );

            try {
                setIsBridging(1);
                const sponsoredFPC = await getSponsoredFPCInstance();
                console.log("fpc shenanigans:)")
                //@ts-ignore
                //await pxe.registerContract({ instance: sponsoredFPC, artifact: SponsoredFPCContract.artifact });
                const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(sponsoredFPC.address);
                const burnTx1 = await AztecWarpToad.methods.burn(noteData?.preImg.amount, noteData?.preImg.destination_chain_id, noteData?.preImg.secret, noteData?.preImg.nullifier_preimg).send({ from: sponsoredFPC.address, fee: { paymentMethod: sponsoredPaymentMethod } }).wait({ timeout: 60 * 10 })
                console.log(burnTx1);
                console.log("burn was a success!!")
                setIsBridging(2);
                downloadFile(noteData!)
                saveNotes([
                    {
                        isAvailable: true,
                        note: noteData!
                    }
                ])
                //update balance
                await fetchInputBalance(originTokenPick?.tokenAddress as `0x${string}`);
                setNotes(loadNotes())
            } catch (error) {
                console.log(error)
                setIsBridging(undefined)
            }

        }




    }

    function hashNullifier(nullifierPreimage: bigint) {
        return poseidon1([nullifierPreimage]);
    }

    function hashPreCommitment(nullifierPreimage: bigint, secret: bigint, chainId: bigint) {
        return poseidon3([nullifierPreimage, secret, chainId]);
    }



    async function handleWithdraw(currentNote: WarptoadNoteStorageEntry, currentNoteIndex: number) {

        if (!currentNote) {
            console.log("no note has been supplied");
            return;
        }


        if (!userAztecWallet) return;

        const isEvmWithdraw = chainIdToString(currentNote.note.preImg.destination_chain_id) !== "Aztec";


        if (isEvmWithdraw) {

            const currentNoteDeployments = evmDeployments[Number(currentNote.note.preImg.destination_chain_id)]
            const sepoliaProvider = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
            const scrollProvider = new JsonRpcProvider("https://scroll-sepolia.publicnode.com");
            const gigaBridge = GigaBridge__factory.connect(evmDeployments[11155111]["L1InfraModule#GigaBridge"], sepoliaProvider);
            const L1WarpToad = WarpToadCore__factory.connect(evmDeployments[11155111]["L1InfraModule#L1WarpToad"], signer);
            const ScrollWarpToad = L2WarpToad__factory.connect(currentNoteDeployments["L2ScrollModule#L2WarpToad"], scrollProvider)

            const addresses = await getContractAddressesAztec(11155111n)
            const AztecWarpToadAddress = addresses.AztecWarpToad

            const AztecWarpToad = await Contract.at(
                AztecAddress.fromString(AztecWarpToadAddress),
                WarpToadCoreContractArtifact,
                userAztecWallet,
            );

            //idk why you have to do this stinky sorcery
            const AztecWarpToadWithSender: WarpToadCoreContract = AztecWarpToad.withWallet(userAztecWallet) as unknown as WarpToadCoreContract;


            console.log("EVM TX")
            console.log("Starting Withdraw")

            // relayer fee logic
            const priorityFee = 100000000n;// in wei (this is 0.1 gwei)
            const maxFee = 5n * 10n ** 18n;   // i don't want to pay no more than 5 usdc okay cool thanks
            const ethPriceInToken = 1700.34 // how much tokens you need to buy 1 eth. In this case 1700 usdc tokens to buy 1 eth. Cheap!
            // L1 evm estimate. re-estimating this on every tx will require you to make a zk proof twice so i hardcoded. You should get a up to date value for L2's with alternative gas pricing from backend/scripts/dev_op/estimateGas.ts
            const gasCost = Number(gasCostPerChain[11155111])
            const relayerBonusFactor = 1.1 // 10% earnings on gas fees! 
            const feeFactor = calculateFeeFactor(ethPriceInToken, gasCost, relayerBonusFactor);
            console.log("gen proof inputs")

            const proofInputs = await getProofInputs(
                gigaBridge,
                ScrollWarpToad,
                AztecWarpToadWithSender,
                currentNote.note.preImg.amount,
                feeFactor,
                priorityFee,
                maxFee,
                userEVMAddress!,
                userEVMAddress!,
                currentNote.note.preImg.nullifier_preimg,
                currentNote.note.preImg.secret,
            )

            console.log(proofInputs)

        } else {
            //if (!pxe) return
            console.log("we are on aztec withdraw")

            const commitment1 = hashCommitment(currentNote.note.preCommitment, currentNote.note.preImg.amount)
            console.log("NOTE IS:", currentNote.note.preImg.destination_chain_id)
            const currentNoteDeployments = evmDeployments[Number(currentNote.note.preImg.destination_chain_id)]

            console.log(currentNoteDeployments)
            const sepoliaProvider = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
            const scrollProvider = new JsonRpcProvider("https://scroll-sepolia.publicnode.com");
            const gigaBridge = GigaBridge__factory.connect(evmDeployments[11155111]["L1InfraModule#GigaBridge"], sepoliaProvider);
            const L1WarpToad = WarpToadCore__factory.connect(evmDeployments[11155111]["L1InfraModule#L1WarpToad"], signer);
            const ScrollWarpToad = L2WarpToad__factory.connect(evmDeployments[534351]["L2ScrollModule#L2WarpToad"], scrollProvider)


            const addresses = await getContractAddressesAztec(11155111n)
            const AztecWarpToadAddress = addresses.AztecWarpToad

            const AztecWarpToad = await Contract.at(
                AztecAddress.fromString(AztecWarpToadAddress),
                WarpToadCoreContractArtifact,
                userAztecWallet,
            );

            const aztecMerkleData = await getMerkleData(gigaBridge, ScrollWarpToad, AztecWarpToad as unknown as WarpToadCore | WarpToadCoreContract, commitment1)

            const balanceRecipientPreMint = await AztecWarpToad.methods.balance_of(await userAztecWallet.getAddress()).simulate({ from: await userAztecWallet.getAddress() })

            console.log("BALANCE PRE CLAIM: ", balanceRecipientPreMint)

            const sponsoredFPC = await getSponsoredFPCInstance();
            //await pxe.registerContract({ instance: sponsoredFPC, artifact: SponsoredFPCContract.artifact });
            const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(sponsoredFPC.address);

            try {

                const mintTx = await AztecWarpToad.methods.mint_giga_root_evm(
                    currentNote.note.preImg.amount,
                    currentNote.note.preImg.secret,
                    currentNote.note.preImg.nullifier_preimg,
                    userAztecWallet.getAddress(),
                    aztecMerkleData.blockNumber,
                    aztecMerkleData.originLocalRoot,
                    aztecMerkleData.gigaMerkleData as any, // no way i am gonna spend time getting this type right >:(
                    aztecMerkleData.evmMerkleData as any,
                ).send({ from: sponsoredFPC.address, fee: { paymentMethod: sponsoredPaymentMethod } }).wait({
                    timeout: 60 * 10 * 1
                })

                console.log("TX: ", mintTx)
                const balanceRecipientPostMint = await AztecWarpToad.methods.balance_of(await userAztecWallet.getAddress()).simulate({ from: await userAztecWallet.getAddress() })

                console.log("BALANCE POST CLAIM: ", balanceRecipientPostMint)
                updateNoteByIndex(currentNoteIndex);
                setNotes(loadNotes());

            } catch (error) {
                console.log("it shat its pants");
                console.log(error)
            }

        }

        //IF SUCCESS THEN DO THIS
        //updateNoteByIndex(currentNoteIndex);
        //setNotes(loadNotes());

        /*
        //check if any notes in local storage at all, if no then let user upload
        if (!currentNote) {
            console.log("no note has been supplied");
            return;
        }
        if (!userAztecWallet) return;

        const addresses = await getContractAddressesAztec(11155111n)
        const AztecWarpToadAddress = addresses.AztecWarpToad

        const AztecWarpToad = await Contract.at(
            AztecAddress.fromString(AztecWarpToadAddress),
            WarpToadCoreContractArtifact,
            userAztecWallet,
        );


        const gigaBridge = GigaBridge__factory.connect(l1Addresses["L1InfraModule#GigaBridge"], signer);
        const l1WarptoadContract = L1WarpToad__factory.connect(l1Addresses["L1InfraModule#L1WarpToad"], signer);

        const commitment = hashCommitment(currentNote.preCommitment, currentNote.preImg.amount);

        console.log(commitment)
        console.log(gigaBridge)


        const aztecMerkleData = await getMerkleData(gigaBridge, l1WarptoadContract, AztecWarpToad as WarpToadCoreContract, commitment)

        if (!aztecMerkleData) {
            console.log("did not manage to get aztec Merkle Data");
            return
        }
        if (!pxe) return;
        const sponsoredFPC = await getSponsoredFPCInstance();
        await pxe.registerContract({ instance: sponsoredFPC, artifact: SponsoredFPCContract.artifact });
        const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(sponsoredFPC.address);
        const balancePreMint = await AztecWarpToad.methods.balance_of(userAztecWallet.getAddress()).simulate();
        console.log({ balancePreMint })
        const mintTx = await AztecWarpToad.methods.mint_giga_root_evm(
            currentNote.preImg.amount,
            currentNote.preImg.secret,
            currentNote.preImg.nullifier_preimg,
            userAztecWallet.getAddress(),
            aztecMerkleData.blockNumber,
            aztecMerkleData.originLocalRoot,
            aztecMerkleData.gigaMerkleData, // no way i am gonna spend time getting this type right >:(
            aztecMerkleData.evmMerkleData,
        ).send({ fee: { paymentMethod: sponsoredPaymentMethod } }).wait({
            timeout: 60 * 60 * 1
        })
        console.log(mintTx);
        const balanceRecipientPostMint = await AztecWarpToad.methods.balance_of(userAztecWallet.getAddress()).simulate()
        console.log("aztec balance after claim: " + balanceRecipientPostMint)
        */

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
        if (originChainPick?.chainType === "AZTEC") {
            setAllowanceSet(true)
            return
        }

        console.log(chainIdEvm)
        console.log(evmDeployments[chainIdEvm as number][chainIdEvm === 11155111 ? "L1InfraModule#L1WarpToad" : "L2ScrollModule#L2WarpToad"])

        if (chainIdEvm === 534351) {
            setAllowanceSet(true);
            return
        }
        const tokenAAllowance = await readContract(config, {
            abi: erc20Abi,
            address: originTokenPick.tokenAddress as `0x${string}`,
            functionName: "allowance",
            args: [userEVMAddress, evmDeployments[chainIdEvm as number][chainIdEvm === 11155111 ? "L1InfraModule#L1WarpToad" : "L2ScrollModule#L2WarpToad"] as `0x${string}`],
            chainId: chainIdEvm as 11155111 | 534351 | undefined
        }) as bigint;

        const decimals = await readContract(config, {
            abi: erc20Abi,
            address: originTokenPick.tokenAddress as `0x${string}`,
            functionName: "decimals",
            chainId: chainIdEvm as 11155111 | 534351 | undefined
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
            chainId: chainIdEvm as 11155111 | 534351 | undefined
        }) as number;

        const parsedAmount = tokenAInput * 10 ** decimals;
        console.log(parsedAmount);

        const txHash = await writeContract(config, {
            abi: erc20Abi,
            address: originTokenPick.tokenAddress as `0x${string}`,
            functionName: "approve",
            args: [evmDeployments[chainIdEvm as number]["L1InfraModule#L1WarpToad"] as `0x${string}`, BigInt(parsedAmount)],
            chainId: chainIdEvm as 11155111 | 534351 | undefined
        })
        await waitForTransactionReceipt(config, {
            hash: txHash,
        })
        await checkAllowance()
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


    useEffect(() => {
        if (tokenAInput > 0) {
            checkAllowance()
        }

    }, [tokenAInput, originTokenPick])


    useEffect(() => {
        if (!originTokenPick) {
            return
        }
        fetchInputBalance(originTokenPick?.tokenAddress as `0x${string}`);
    }, [originTokenPick, isSwapped])


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

    async function fetchInputBalance(erc20Address: `0x${string}`) {
        if (originChainPick?.chainType === "EVM") {
            if (!userEVMAddress) {
                return 0;
            }
            try {
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

            } catch (error) {
                console.log(error)
                setTokenABalance(0);
            }
        }

        if (originChainPick?.chainType === "AZTEC") {
            if (!userAztecWallet) {
                return 0;
            }

            // 1. read decimals
            const decimals = 18


            const addresses = await getContractAddressesAztec(11155111n)
            const AztecWarpToadAddress = addresses.AztecWarpToad

            const AztecWarpToad = await Contract.at(
                AztecAddress.fromString(AztecWarpToadAddress),
                WarpToadCoreContractArtifact,
                userAztecWallet,
            );

            const tokenbalance = await AztecWarpToad.methods.balance_of(userAztecWallet.getAddress()).simulate({ from: userAztecWallet.getAddress() });

            // 3. format with correct decimals
            const formatted = formatUnits(tokenbalance, decimals);

            setTokenABalance(Number(formatted));
        }
    }

    const handleTokenAInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(",", ".");
        if (!/^\d*(?:\.\d{0,18})?$/.test(v)) return;
        setTokenAInput(v === "" ? 0 : Number(v));
        setTokenAInputRaw(e.target.value);
    };



    return (
        <>
            {isConnected ? (
                <div className="p-2 md:p-0 h-full flex items-center justify-center" >
                    {isBridging === undefined ? (
                        <div className="w-full h-12/12 md:h-6/12 flex flex-col items-center justify-center p-2 gap-2">
                            <div className="w-full md:w-1/3 flex justify-between ">
                                <button className={`btn btn-secondary rounded-xl ${isDeposit ? "" : "btn-outline"}`}
                                    onClick={() => { setIsDeposit(true) }}
                                >deposit</button>
                                <button className={`btn btn-secondary rounded-xl ${!isDeposit ? "" : "btn-outline"}`}
                                    onClick={() => { setIsDeposit(false) }}
                                >withdraw</button>
                            </div>
                            {isDeposit ? (
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

                                                                                originTokenSelection.map((token: TokenInfo) => (
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
                                        {allowanceSet || (originChainPick?.chainType === "AZTEC") ? (
                                            <button onClick={async () => {
                                                await handleDeposit();
                                            }} className="btn btn-secondary flex-grow" disabled={tokenAInput <= 0 || !originChainPick || !destinationChainPick}>
                                                Start Bridge
                                            </button>
                                        ) : (
                                            <button onClick={setAllowance} className="btn btn-secondary flex-grow" disabled={tokenAInput <= 0}>
                                                Approve First
                                            </button>
                                        )}

                                    </div>
                                </div>
                            ) : (
                                <div className="md:w-1/3 border rounded-2xl flex flex-col items-center p-2 gap-2">
                                    <div className="flex w-full h-full justify-around gap-2 flex-grow flex-col relative">
                                        {
                                            (notes.length >= 1) ? (
                                                <>
                                                    {notes.map((note: WarptoadNoteStorageEntry, i: any) => (
                                                        <div key={i}
                                                            className={`border rounded text-center p-2 flex gap-2 justify-between items-center ${note.isAvailable ? "" : "bg-error/50"}`}>
                                                            <div className="flex gap-2 justify-center items-center">
                                                                <img src={`/chains/${chainIdToString(note.note.preImg.destination_chain_id).toLowerCase()}.png`} alt="" className="h-10" />
                                                                <div className="flex flex-col text-start">
                                                                    <p className="font-bold">
                                                                        {chainIdToString(note.note.preImg.destination_chain_id)}
                                                                    </p>
                                                                    {parseTokenWithdrawAmount(note.note.preImg.amount, note.note.preImg.destination_chain_id)} USDC
                                                                </div>
                                                            </div>
                                                            <button className="btn btn-secondary"
                                                                disabled={!note.isAvailable}
                                                                onClick={async () => {
                                                                    await handleWithdraw(note, i)
                                                                }}
                                                            >{note.isAvailable ? "withdraw" : "redeemed"}</button>
                                                        </div>
                                                    )
                                                    )
                                                    }
                                                </>
                                            ) : (
                                                <div className="w-full text-center">
                                                    <p>no withdrawals in storage</p>
                                                </div>
                                            )
                                        }
                                        <NoteInput
                                            onImported={(notes) => {
                                                setNotes(notes);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="border rounded-2xl flex flex-col items-center p-8">
                            <div className="w-full h-full flex justify-between items-center flex-col gap-4">
                                <h1 className="text-center text-2xl font-bold">
                                    {bridgeStates[isBridging]}
                                    {isBridging !== 2 ? (<span className="loading loading-dots"></span>) : (null)}
                                </h1>
                                <img src={logo} alt="warptoad logo" className="w-1/3" />
                                {isBridging === 2 ? (
                                    <div className="w-full flex gap-2">
                                        <button className="btn btn-secondary btn-outline basis-1/2"
                                            onClick={() => {
                                                setIsBridging(undefined)
                                                setIsDeposit(true)
                                            }
                                            }
                                        >deposit again</button>
                                        <button className="btn btn-secondary btn-outline basis-1/2"
                                            onClick={() => {
                                                setIsBridging(undefined)
                                                setIsDeposit(false)
                                            }
                                            }
                                        >withdraw</button>
                                    </div>
                                ) : (null)}
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
