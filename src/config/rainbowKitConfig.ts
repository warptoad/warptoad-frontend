import {
    scrollSepolia
} from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
    appName: 'Warptoad',
    projectId: import.meta.env.VITE_WC_PROJECT_ID,
    chains: [
        scrollSepolia
    ]
});
