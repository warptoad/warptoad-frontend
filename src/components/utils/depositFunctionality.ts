import { poseidon2, poseidon3 } from 'poseidon-lite';
import {Fr, Contract, AztecAddress} from '@aztec/aztec.js';
import { getContractAddressesAztec, getL2AZTECContracts } from 'warp-toad-old-backend/deployment';
import { SEPOLIA_CHAINID } from 'warp-toad-old-backend/constants';

type ChainType = {
    type: "AZTEC" | "EVM";
    chainId: string;
}

export type DepositData = {
    fromChain: ChainType;
    toChain: ChainType
    tokenName: string;
    tokenAmount: number;
    tokenBalance?: number;
    tokenDollarValue?: number;
    approved?: boolean;
    wrapped?: boolean;
}

export type CommitmentPreImg = {
    amount: bigint;
    destination_chain_id: bigint;
    secret: bigint;
    nullifier_preimg: bigint;
}

export type WarptoadNote = {
    preImg: CommitmentPreImg;
    preCommitment: bigint;
}

export function createRandomPreImg(amount: bigint, chainIdAztecFromContract: bigint) {
    const preImg: CommitmentPreImg = {
        amount,
        destination_chain_id: chainIdAztecFromContract,
        secret: Fr.random().toBigInt(),
        nullifier_preimg: Fr.random().toBigInt(),
    }
    return preImg
}

function hashPreCommitment(preImg: CommitmentPreImg): bigint {
    return poseidon3([preImg.nullifier_preimg, preImg.secret, preImg.destination_chain_id])
}

export function hashCommitment(preCommitment: bigint, amount: bigint): bigint {
    return poseidon2([preCommitment, amount])
}

export async function getChainIdAztecFromContract() {

    const aztecAddressDeployment = await getContractAddressesAztec(SEPOLIA_CHAINID)

    if (!window.azguard) {
        throw "Azguard Wallet is not installed";
    }
    const wallet = window.azguard.createClient()

    const lol = await wallet.request('execute').

    console.log(lol)


/*
    const deployments = getL2AZTECContracts()


    const aztecWallet = get(aztecWalletStore);
    if (!aztecWallet) {
        console.warn('EVM wallet not connected');
        return;
    }

    const AztecWarpToad = await Contract.at(
        AztecAddress.fromString(aztecAddressDeployment),
        WarpToadCoreContractArtifact,
        aztecWallet,
    );



    const aztecVersion = (await aztecWallet.getNodeInfo()).rollupVersion;
    const chainIdAztecFromContract = await AztecWarpToad.methods.get_chain_id_unconstrained(aztecVersion).simulate() as bigint
    return chainIdAztecFromContract
    */
}

export async function createPreCommitment(amount: bigint, chainIdAztecFromContract: bigint) {

    const commitmentPreImg = createRandomPreImg(amount, chainIdAztecFromContract);
    if (!commitmentPreImg) {
        return;
    }

    console.log(commitmentPreImg)
    const preCommitment = hashPreCommitment(commitmentPreImg)

    const note: WarptoadNote = {
        preImg: commitmentPreImg,
        preCommitment: preCommitment
    }
    console.log("NOTE CREATED")
    return note;

}