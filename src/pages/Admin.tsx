import { useAccount } from "wagmi"
import AdminMintToken from "../components/Admin/AdminMintToken"
import AdminSetUp from "../components/Admin/AdminSetUp"
import AdminCreatePair from "../components/Admin/AdminCreatePair"
import AdminRetirePair from "../components/Admin/AdminRetirePair"
import { useState } from "react"

function Admin() {
    const account = useAccount()
    const [pairCreated, setPairCreated] = useState(false);
    const [pairDeleted, setPairDeleted] = useState(false);

    const handlePairCreated = () => {
        setPairCreated(true);
    };
    const handlePairDeleted = () => {
        setPairDeleted(true);
    }

    return (
        <div className="flex-grow flex flex-col gap-2 p-2">
            {account.status == "connected" ? (
                account.address == "0x4301184a8D9a2A3bf531a9337B534b7477174E5c" ?
                    (
                        <div className="h-full flex flex-col gap-8 lg:gap-2">
                            <div className="h-1/2 w-full flex flex-col lg:flex-row gap-2">
                                <AdminMintToken />
                                <AdminSetUp />
                            </div>
                            <div className="h-1/2 w-full flex flex-col lg:flex-row  gap-2">
                                <AdminCreatePair onCreate={handlePairCreated} pairDeleted={pairDeleted} />
                                <AdminRetirePair onDelete={handlePairDeleted} pairCreated={pairCreated} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex justify-center items-center">
                            <p>you are not an admin</p>
                        </div>
                    )
            ) : (
                <div className="h-full flex justify-center items-center">
                    <p>you are not connected</p>
                </div>
            )}
        </div>
    )
}

export default Admin
