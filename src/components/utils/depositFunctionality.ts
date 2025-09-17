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

export type WarptoadNoteStorageEntry = {
    note: WarptoadNote;
    isAvailable: boolean;
}

export function saveNotes(newNotes: WarptoadNoteStorageEntry[]) {
    const stored = localStorage.getItem("warptoadNotes");
    let existing: WarptoadNoteStorageEntry[] = [];

    if (stored) {
        try {
            existing = JSON.parse(stored, (_, v) =>
                typeof v === "string" && /^\d+$/.test(v) ? BigInt(v) : v
            );
        } catch {
            existing = [];
        }
    }

    // Build a set of existing preCommitments (as string for easy comparison)
    const existingKeys = new Set(
        existing.map(n => n.note.preCommitment.toString())
    );

    // Only keep notes not already present
    const uniques = newNotes.filter(
        n => !existingKeys.has(n.note.preCommitment.toString())
    );

    // Append uniques
    const merged = [...existing, ...uniques];

    // Save back
    const serialized = JSON.stringify(merged, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
    localStorage.setItem("warptoadNotes", serialized);
}

export function updateNoteByIndex(index: number) {
    const stored = localStorage.getItem("warptoadNotes");
    let existing: WarptoadNoteStorageEntry[] = [];

    if (stored) {
        try {
            existing = JSON.parse(stored, (_, v) =>
                typeof v === "string" && /^\d+$/.test(v) ? BigInt(v) : v
            );
        } catch {
            existing = [];
        }
    }

    if (index < 0 || index >= existing.length) {
        console.warn(`updateNoteByIndex: index ${index} out of bounds`);
        return;
    }

    // Replace the entry with isAvailable = false
    existing[index] = { ...existing[index], isAvailable: false };

    const serialized = JSON.stringify(existing, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
    localStorage.setItem("warptoadNotes", serialized);
}



// Load notes array
export function loadNotes(): WarptoadNoteStorageEntry[] {
    const stored = localStorage.getItem("warptoadNotes");
    if (!stored) return [];
    return JSON.parse(stored, (_, value) =>
        typeof value === "string" && /^\d+$/.test(value) ? BigInt(value) : value
    );
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