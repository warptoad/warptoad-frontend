import { useRef } from "react";

function TokenSelector() {
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const openDialog = () => dialogRef.current?.showModal();
    const closeDialog = () => dialogRef.current?.close();

    return (
        <>
            <button className="btn" onClick={openDialog}>
                Token
            </button>
            <dialog ref={dialogRef} id="selectTokenModal" className="modal">
                <div className="modal-box h-1/2 w-2/5 max-w-5xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Select Token</h3>
                        <form method="dialog">
                            <button className="p-0 hover:cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </form>
                    </div>
                    <div className="flex w-full h-full gap-2">
                        <div className="h-full flex-1/3 bg-base-200 p-2 rounded-md">
                            <label className="input w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-search-icon lucide-search"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                                <input type="search" className="grow" placeholder="Search Chain" />
                            </label>
                        </div>
                        <div className="h-full flex-1/2 bg-base-300 p-2 rounded-md">
                            <label className="input w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-search-icon lucide-search"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                                <input type="search" className="grow" placeholder="Search Token" />
                            </label>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default TokenSelector
