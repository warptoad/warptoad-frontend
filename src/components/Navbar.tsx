import { NavLink } from "react-router-dom";
import { CustomConnectKitButton } from "./CustomConnectKitButton";
import logo from "../assets/WarptoadLogo.svg";
import { useEffect, useState } from "react";

function Navbar() {
    const closeDrawer = () => {
        const el = document.getElementById("navbarDrawer") as HTMLInputElement | null;
        if (el) el.checked = false;
    };

    const getIsDark = () =>
        (document.documentElement.getAttribute("data-theme") || "OCBashoLight") === "OCBashoDark";

    const [isDark, setIsDark] = useState(getIsDark());

    useEffect(() => {
        const ob = new MutationObserver(() => setIsDark(getIsDark()));
        ob.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        return () => ob.disconnect();
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.checked ? "OCBashoDark" : "OCBashoLight";
        document.documentElement.setAttribute("data-theme", next);
        setIsDark(e.target.checked);
    };


    return (
        <>
            <div className="navbar">
                <div className="navbar-start">
                    <NavLink to="/" className="btn btn-primary text-xl">
                        <img src={logo} alt="Warptoad Logo" className="w-12" />
                    </NavLink>
                </div>

                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal font-['AeonikFono'] font-medium gap-2">
                    </ul>
                </div>

                <div className="navbar-end justify-end">
                    <div className="hidden lg:flex items-center gap-2">
                        <label className="toggle toggle-lg text-secondary hidden lg:grid">
                            <input type="checkbox" checked={isDark} onChange={onChange} />
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon-icon lucide-moon"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>
                        </label>
                        <NavLink to="/account" className={({ isActive }) => `btn btn-secondary ${isActive ? "" : "btn-outline"}`} >
                            Account
                        </NavLink>
                        {/* 
                        <CustomConnectKitButton />
                        */}
                    </div>
                    <label htmlFor="navbarDrawer" className="btn btn-secondary btn-outline btn-square rounded-xl drawer-button lg:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="inline-block h-6 w-6 stroke-current"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            ></path>
                        </svg>
                    </label>
                </div>
            </div >
            <div className="drawer drawer-end lg:hidden">
                <input id="navbarDrawer" type="checkbox" className="drawer-toggle" />

                <div className="drawer-side">
                    <label htmlFor="navbarDrawer" aria-label="close sidebar" className="drawer-overlay"></label>
                    <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 flex justify-between gap-4">
                        <div className="w-full flex justify-between items-center">
                            <h3 className="font-bold text-4xl">Menu</h3>
                            <label htmlFor="navbarDrawer" className="btn btn-secondary btn-square rounded-xl drawer-button lg:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </label>
                        </div>
                        <div className="flex flex-col gap-2 flex-grow justify-start border rounded-xl p-4">
                            <li className="flex flex-row gap-2 justify-center items-center mt-auto">
                                <p className="text-lg font-black">
                                    Theme:
                                </p>
                                <div>
                                    <label className="toggle toggle-lg text-secondary">
                                        <input type="checkbox" checked={isDark} onChange={onChange} />
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon-icon lucide-moon"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>
                                    </label>
                                </div>
                            </li>
                        </div>
                        <NavLink
                            to="/account"
                            className={({ isActive }) => `btn btn-secondary ${isActive ? "" : "btn-outline"}`}
                            onClick={closeDrawer}
                        >
                            Account
                        </NavLink>
                    </ul>
                </div>
            </div>
        </>
    );
}

export default Navbar;
