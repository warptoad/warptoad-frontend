import { poseidon2, poseidon3 } from 'poseidon-lite';
import { Fr, Contract, AztecAddress } from '@aztec/aztec.js';
import { getContractAddressesAztec, getL2AZTECContracts } from '@warp-toad/backend/deployment';
import { SEPOLIA_CHAINID } from '@warp-toad/backend/constants';

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

export function saveNotes(notes: WarptoadNote[]) {
    const serialized = JSON.stringify(notes, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
    localStorage.setItem("warptoadNotes", serialized);
}

// Load notes array
export function loadNotes(): WarptoadNote[] {
    const stored = localStorage.getItem("warptoadNotes");
    if (!stored) return [];

    return JSON.parse(stored, (_, value) => {
        // Convert back strings that look like bigints
        if (typeof value === "string" && /^\d+$/.test(value)) {
            return BigInt(value);
        }
        return value;
    });
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

export async function createPreCommitment(amount: bigint, chainIdAztecFromContract: bigint) {

    const commitmentPreImg = createRandomPreImg(amount, chainIdAztecFromContract);
    if (!commitmentPreImg) {
        return;
    }
    const preCommitment = hashPreCommitment(commitmentPreImg)

    const note: WarptoadNote = {
        preImg: commitmentPreImg,
        preCommitment: preCommitment
    }
    console.log("NOTE CREATED")
    return note;

}