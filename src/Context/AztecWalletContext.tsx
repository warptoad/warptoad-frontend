// AzguardContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPXEClient, waitForPXE, type PXE, type Wallet, GrumpkinScalar, SponsoredFeePaymentMethod, Fr, type ContractInstanceWithAddress, createAztecNodeClient, AztecAddress } from '@aztec/aztec.js';
import { WarpToadCoreContractArtifact, WarpToadCoreContract } from "@warp-toad/backend/aztec/WarpToadCore";
import { L2AztecBridgeAdapterContract, L2AztecBridgeAdapterContractArtifact } from "@warp-toad/backend/aztec/L2AztecBridgeAdapter";
import { getContractAddressesAztec } from "@warp-toad/backend/deployment";
import { SPONSORED_FPC_SALT } from '@aztec/constants';
import { getSchnorrAccount } from "@aztec/accounts/schnorr";
import { ethers } from "ethers";
import { deriveSigningKey } from "@aztec/stdlib/keys";
import { Contract, getContractInstanceFromDeployParams } from '@aztec/aztec.js/contracts';
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";


type AzguardContextValue = {
  isConnected: boolean;
  isLoading: boolean;
  address: string | null;
  wallet: Wallet | null | undefined;
  pxe: PXE | null | undefined;
  connect: (secretKey: `0x${string}`) => Promise<void>;
  disconnect: () => Promise<void>;
  restore: () => Promise<void>;
  testMint: () => Promise<void>;
  createRandomPrivKey: () => `0x${string}`
};

const AztecWalletContext = createContext<AzguardContextValue | null>(null);

export function AztecWalletProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Wallet | null>(null);
  const initOnceRef = useRef(false);

  const [isLoading, setIsLoading] = useState(false);

  const [pxeStore, setPxeStore] = useState<PXE | null>();
  const [walletStore, setWalletStore] = useState<Wallet | null>();

  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!walletStore) return
    setAddress(walletStore.getAddress().toString())
  }, [walletStore])

  async function instantiatePXE() {

    const delay = async (timeInMs: number) => await new Promise((resolve) => setTimeout(resolve, timeInMs))
    const { PXE_URL = 'https://pxe.warptoad.xyz' } = process.env;
    const PXE = createPXEClient(PXE_URL);
    await waitForPXE(PXE);
    setPxeStore(PXE);

    const addresses = await getContractAddressesAztec(11155111n)
    const AztecWarpToadAddress = addresses.AztecWarpToad
    const L2AztecAdapterAddress = addresses.L2AztecBridgeAdapter

    const alreadyRegistered = localStorage.getItem('aztecContractsRegistered');


    if (!alreadyRegistered) {
      //TODO NEEDED IF PXE RESETS
      console.log("assuming u r not on sand box so registering the contracts with aztec testnet node")

      const node = createAztecNodeClient("https://aztec-alpha-testnet-fullnode.zkv.xyz")
      const AztecWarpToadContract = await node.getContract(AztecAddress.fromString(AztecWarpToadAddress))
      if (AztecWarpToadContract) {

        await PXE.registerContract({
          instance: AztecWarpToadContract,
          //@ts-ignore
          artifact: WarpToadCoreContractArtifact,
        })
        await delay(10000)
        const L2AztecAdapterContract = await node.getContract(AztecAddress.fromString(L2AztecAdapterAddress))

        if (L2AztecAdapterContract) {
          await PXE.registerContract({
            instance: L2AztecAdapterContract,
            //@ts-ignore
            artifact: L2AztecBridgeAdapterContractArtifact,
          })
          await delay(10000)
        }

        localStorage.setItem('aztecContractsRegistered', "1");
      }
      console.log("DONE")
    
    }

  }

  function createRandomAztecPrivateKey(): `0x${string}` {
    const privKey = GrumpkinScalar.random();
    const scalar = privKey.toBigInt(); // bigint
    const hex = '0x' + scalar.toString(16).padStart(64, '0');
    return hex as `0x${string}`
  }

  async function fetchSchnorrAccount(secretKey: `0x${string}`, salt: string) {
    if (!pxeStore) {
      return
    }

    let currentSecretKey = Fr.fromHexString(secretKey);
    let currentSalt = Fr.fromHexString(salt);

    let schnorrAccount = await getSchnorrAccount(pxeStore, currentSecretKey, deriveSigningKey(currentSecretKey), currentSalt.toBigInt());
    let wallet = await schnorrAccount.getWallet();
    setWalletStore(wallet);
  }

  async function getSponsoredFPCInstance(): Promise<ContractInstanceWithAddress> {
    //@ts-ignore
    return await getContractInstanceFromDeployParams(SponsoredFPCContract.artifact, {
      salt: new Fr(SPONSORED_FPC_SALT),
    });
  }

  async function deploySchnorrAccount(secretKey: `0x${string}`, salt: string) {
    if (!pxeStore) {
      console.log("error no PXE");
      return;
    }
    const sponsoredFPC = await getSponsoredFPCInstance();
    //@ts-ignore
    await pxeStore.registerContract({ instance: sponsoredFPC, artifact: SponsoredFPCContract.artifact });
    const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(sponsoredFPC.address);

    let currentSecretKey = Fr.fromHexString(secretKey);
    let currentSalt = Fr.fromHexString(salt);

    let schnorrAccount = await getSchnorrAccount(pxeStore, currentSecretKey, deriveSigningKey(currentSecretKey), currentSalt.toBigInt());

    try {
      //TODO: find out deploy wallet not funded?
      await schnorrAccount.deploy({ fee: { paymentMethod: sponsoredPaymentMethod } }).wait({ timeout: 60 * 60 * 12 });
    } catch (error) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const chainId = (await provider.getNetwork()).chainId
      if (chainId != 11155111n) {
        console.log(error)
      }
    }
    let wallet = await schnorrAccount.getWallet();

    setWalletStore(wallet);
  }

  async function mintTestTokens() {
    if (!walletStore) {
      console.warn('AZTEC wallet not connected');
      return;
    }

    const addresses = await getContractAddressesAztec(11155111n)
    const AztecWarpToadAddress = addresses.AztecWarpToad

    const AztecWarpToad = await Contract.at(
      AztecAddress.fromString(AztecWarpToadAddress),
      WarpToadCoreContractArtifact,
      walletStore,
    );

    const initialBalanceSender = 10n * 10n ** 18n
    const sponsoredFPC = await getSponsoredFPCInstance();
    console.log("fpc shenanigans:)")
    //@ts-ignore
    await pxeStore.registerContract({ instance: sponsoredFPC, artifact: SponsoredFPCContract.artifact });
    const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(sponsoredFPC.address);
    //@ts-ignore
    console.log("now comes the big moment!")
    try {
    await AztecWarpToad.methods.mint_for_testing(initialBalanceSender, walletStore.getAddress()).send({ fee: { paymentMethod: sponsoredPaymentMethod } }).wait({ timeout: 60 * 10 })
    console.log("it worked, yay!! :D")
      
    } catch (error) {
      console.log(error)
      console.log("do you have enough feejuice?")
    }
    const usdcBalance = await AztecWarpToad.methods.balance_of(walletStore.getAddress()).simulate();
    console.log(usdcBalance)

  }

  async function connectAztecWallet(secretKey: `0x${string}`): Promise<void> {
    setIsLoading(true)
    if (!pxeStore) {
      console.log("error no PXE");
      setIsLoading(false)
      return;
    }

    const privateKey = secretKey;
    const salt = createRandomAztecPrivateKey(); // can also randomize per user if needed

    await deploySchnorrAccount(privateKey, salt);
    //TODO: MAKE IT MORE SECURE WHEN RELEASED LOOOOL
    // Persist keys
    localStorage.setItem('aztecPrivateKey', privateKey);
    localStorage.setItem('aztecSalt', salt);
    setIsLoading(false)
    setIsConnected(true)
  }

  async function restoreAztecWalletIfPossible(): Promise<void> {
    setIsLoading(true)
    const privKey = localStorage.getItem('aztecPrivateKey');
    const salt = localStorage.getItem('aztecSalt');
    if (!privKey || !salt) {
      setIsLoading(false)
      return;
    }

    if (!pxeStore) {
      setIsLoading(false)
      return;
    }

    await fetchSchnorrAccount(privKey as `0x${string}`, salt);
    setIsLoading(false)
    setIsConnected(true)
  }

  async function disconnectAztecWallet(): Promise<void> {
    setWalletStore(undefined);
    localStorage.removeItem('aztecPrivateKey');
    localStorage.removeItem('aztecSalt');
    setIsConnected(false)
  }

  async function initInstance() {
    setIsLoading(true)
    await instantiatePXE();
    setIsLoading(false)
  }


  useEffect(() => {
    initInstance();
  }, []);
  useEffect(() => {
    if (pxeStore) {
      restoreAztecWalletIfPossible();
    }

  }, [pxeStore]);

  const value: AzguardContextValue = {
    isConnected,
    isLoading,
    address,
    wallet: walletStore,
    pxe: pxeStore,
    connect: connectAztecWallet,
    disconnect: disconnectAztecWallet,
    restore: restoreAztecWalletIfPossible,
    testMint: mintTestTokens,
    createRandomPrivKey: createRandomAztecPrivateKey
  };

  return <AztecWalletContext.Provider value={value}>{children}</AztecWalletContext.Provider>;
}

export function useAztecWallet() {
  const ctx = useContext(AztecWalletContext);
  if (!ctx) throw new Error("useAzguard must be used within <AztecWalletProvider>");
  return ctx;
}
