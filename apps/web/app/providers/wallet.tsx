// Wallet wiring — RainbowKit + injected (MetaMask), Sepolia
"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import "@rainbow-me/rainbowkit/styles.css";

const connectors = connectorsForWallets(
  [{ groupName: "Recommended", wallets: [injectedWallet] }],
  { appName: "Veridex", projectId: "veridex-demo" } // injected-only, no WalletConnect cloud needed
);

const config = createConfig({
  chains: [sepolia],
  connectors,
  transports: { [sepolia.id]: http() },
  ssr: true,
});

const qc = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
