import ConnectWalletButton from "./ConnectWalletButton"

function Navbar() {

    return (
        <div className="py-4 px-8 bg-primary w-full flex justify-between items-center">
            <p>
                warptoad
            </p>
            <ConnectWalletButton/>
        </div>
    )
}

export default Navbar
