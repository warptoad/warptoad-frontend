import { useState } from "react"
import { useDisconnect, useAccount } from 'wagmi';
import TokenSelector from "./TokenSelector";

function From() {
    const [inputAmountRaw, setInputAmountRaw] = useState("0");
    const [inputAmount, setInputAmount] = useState(0);
    const [isDollarInput, setIsDollarInput] = useState(false); // false = ETH to USD

    const dollarPricePerToken = 3500.36;

    const { address: rainbowKitAddress, isConnected: isRainbowKitConnected } = useAccount();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/^\$/, ''); // remove leading $ if present
        setInputAmountRaw(e.target.value);

        const numericValue = parseFloat(value);
        if (value === "" || isNaN(numericValue)) {
            setInputAmount(0);
        } else {
            setInputAmount(numericValue);
        }
    };

    const convertedValue = isDollarInput
        ? inputAmount / dollarPricePerToken
        : inputAmount * dollarPricePerToken;

    const displayValue = convertedValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    });

    const toggleConversion = () => {
        setInputAmountRaw("0");
        setInputAmount(0);
        setIsDollarInput((prev) => !prev);
    };

    return (
        <div className="card bg-base-100 flex flex-row justify-between p-4">
            <div className="flex flex-col gap-4">
                <p className="justify-self-start">from</p>
                <div>
                    <span className="text-2xl">
                        {isDollarInput ? "$" : ""}
                    </span>
                    <input
                        type="text"
                        className="text-2xl"
                        placeholder={isDollarInput ? "0.00" : "0.0"}
                        value={inputAmountRaw}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="justify-self-end flex items-center gap-2">
                    <p className="text-sm">
                        {isDollarInput
                            ? `${displayValue} ETH`
                            : `$${displayValue}`}
                    </p>
                    <button className="btn btn-xs" onClick={toggleConversion}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="0.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down">
                            <path d="m21 16-4 4-4-4" />
                            <path d="M17 20V4" />
                            <path d="m3 8 4-4 4 4" />
                            <path d="M7 4v16" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-4 items-end">
                {isRainbowKitConnected ? (
                    <details className="dropdown dropdown-end">
                        <summary className="flex gap-1 text-secondary hover:cursor-pointer" style={{ listStyle: 'none' }}>
                            <p>
                                {rainbowKitAddress ? `${rainbowKitAddress.slice(0, 4)}...${rainbowKitAddress.slice(-4)}` : ""}
                            </p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6" /></svg>
                        </summary>
                        <ul className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                            <li><a>evm wallet</a></li>
                            <li><a>aztec wallet</a></li>
                        </ul>
                    </details>
                ) : (
                    <p className="text-secondary hover:cursor-pointer">
                        select wallet
                    </p>
                )}
                <TokenSelector />
                {isRainbowKitConnected ? (
                    <div className="flex gap-2 items-center">
                        <p className="justify-self-end">balance: 0</p>
                        <button className="btn btn-sm">max</button>
                    </div>
                ) : (null)}
            </div>
        </div>
    )
}

export default From
