import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import './index.css'
import App from './App.tsx'
import { config } from './config/wagmiConfig.ts';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <ConnectKitProvider
        customTheme={{
          "--ck-border-radius": "24px",
          "--ck-connectbutton-font-size": "17px",
          "--ck-connectbutton-border-radius": "12px",
          "--ck-connectbutton-color": "#414451",
          "--ck-connectbutton-background": "#ffffff",
          "--ck-connectbutton-box-shadow": "inset 0 0 0 1px #E9EAEC, 0px 2px 4px rgba(0, 0, 0, 0.02)",
          "--ck-connectbutton-hover-background": "#F6F7F9",
          "--ck-connectbutton-hover-box-shadow": "inset 0 0 0 1px #E9EAEC, 0px 2px 4px rgba(0, 0, 0, 0.02)",
          "--ck-connectbutton-balance-color": "#373737",
          "--ck-connectbutton-balance-background": "#F6F7F9",
          "--ck-connectbutton-balance-box-shadow": "none",
          "--ck-connectbutton-balance-hover-background": "#f1f1f3",
          "--ck-primary-button-border-radius": "100px",
          "--ck-primary-button-color": "#292929",
          "--ck-primary-button-background": "#ebf1e5",
          "--ck-primary-button-box-shadow": "0 0 0 1px #292929, 0px 2px 4px rgba(0, 0, 0, 0.02)",
          "--ck-primary-button-hover-background": "#cedbca",
          "--ck-primary-button-hover-box-shadow": "0 0 0 1px #292929, 0px 2px 4px rgba(0, 0, 0, 0.02)",
          "--ck-secondary-button-border-radius": "100px",
          "--ck-secondary-button-color": "#292929",
          "--ck-secondary-button-background": "#cedbca",
          "--ck-secondary-button-box-shadow": "0 0 0 1px #292929, 0px 2px 4px rgba(0, 0, 0, 0.02)",
          "--ck-secondary-button-hover-background": "#ebf1e5",
          "--ck-secondary-button-hover-box-shadow": "0 0 0 1px #292929, 0px 0 0 rgba(0, 0, 0, 0.02)",
          "--ck-focus-color": "#292929",
          "--ck-modal-box-shadow": "0px 0px 0px 2px #292929, 0px 2px 4px rgba(0,0,0,0.02)",
          "--ck-body-color": "#292929",
          "--ck-body-color-muted": "#292929",
          "--ck-body-color-muted-hover": "#000000",
          "--ck-body-background": "#ebf1e5",
          "--ck-body-background-transparent": "rgba(255,255,255,0)",
          "--ck-body-background-secondary": "#ebf1e5",
          "--ck-body-background-secondary-hover-background": "#e0e4eb",
          "--ck-body-background-secondary-hover-outline": "#4282FF",
          "--ck-body-background-tertiary": "#ebf1e5",
          "--ck-tertiary-border-radius": "13px",
          "--ck-tertiary-box-shadow": "inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
          "--ck-body-action-color": "#999999",
          "--ck-body-divider": "#292929",
          "--ck-body-color-danger": "#b87a7a",
          "--ck-body-color-valid": "#7ea172",
          "--ck-body-disclaimer-background": "#F9FAFA",
          "--ck-body-disclaimer-color": "#292929",
          "--ck-body-disclaimer-link-color": "#787B84",
          "--ck-body-disclaimer-link-hover-color": "#000000",
          "--ck-copytoclipboard-stroke": "#CCCCCC",
          "--ck-tooltip-background": "#ffffff",
          "--ck-tooltip-background-secondary": "#ffffff",
          "--ck-tooltip-color": "#999999",
          "--ck-tooltip-shadow": "0px 2px 10px rgba(0, 0, 0, 0.08)",
          "--ck-spinner-color": "#292929",
          "--ck-dropdown-button-color": "#999999",
          "--ck-dropdown-button-box-shadow": "0 0 0 1px rgba(0, 0, 0, 0.01), 0px 0px 7px rgba(0, 0, 0, 0.05)",
          "--ck-dropdown-button-background": "#fff",
          "--ck-dropdown-button-hover-color": "#8B8B8B",
          "--ck-dropdown-button-hover-background": "#E7E7E7",
          "--ck-dropdown-color": "rgba(55, 55, 55, 0.4)",
          "--ck-dropdown-box-shadow": "0px 2px 15px rgba(0, 0, 0, 0.15)",
          "--ck-alert-color": "#9196A1",
          "--ck-alert-background": "#F6F8FA",
          "--ck-alert-box-shadow": "inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
          "--ck-alert-border-radius": "8px",
          "--ck-qr-border-radius": "12px",
          "--ck-qr-dot-color": "#292929",
          "--ck-qr-border-color": "#292929",
          "--ck-siwe-border": "#EAEBED",
          "--ck-overlay-background": "#ebf1e5",
          "--ck-font-family": "AeonikFono",
        }}
      >
        <BrowserRouter>
          <StrictMode>
            <App />
          </StrictMode>
        </BrowserRouter>
      </ConnectKitProvider>
    </QueryClientProvider>
  </WagmiProvider >,
)
