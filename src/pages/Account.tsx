
import { useAccount } from "wagmi";
import { CustomConnectKitButton } from "../components/CustomConnectKitButton";
import AzguardWallet from "../components/Aztec/AzguardWallet";


function Account() {
    const { address: userAddress, isConnected } = useAccount();

    return (
        <div className="p-2 md:p-0 h-full flex items-center justify-center" >
            <div className="w-full h-12/12 md:h-6/12 flex flex-col items-center justify-center p-2 gap-2">
                <div className="md:w-1/3 border rounded-2xl flex flex-col items-center p-2 gap-2">
                    <div className="flex gap-2 items-center">
                        <div aria-label="status" className={`status status-xl ${isConnected?"status-success":"status-error"}`}></div>
                        <p className="btn btn-secondary">EVM wallet</p>
                        <CustomConnectKitButton />
                    </div>
                    <div className="flex gap-2 items-center">
                        <div aria-label="status" className={`status status-xl ${isConnected?"status-success":"status-error"}`}></div>
                        <p className="btn btn-secondary">Aztec wallet</p>
                        <AzguardWallet />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Account
