import type { Metadata } from "next";
import { Archivo_Black, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./components/header";

const display = Archivo_Black({ weight: "400", variable: "--font-display", subsets: ["latin"] });
const body = Archivo({ variable: "--font-body", subsets: ["latin"] });
const hash = JetBrains_Mono({ variable: "--font-hash", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Veridex — the token is a seal",
  description: "Soulbound credential seal. The file stays off-chain.",
  icons: [{ rel: "icon", url: "/diagram.svg", type: "image/svg+xml" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hash.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* THESIS: a seal-room, not a SaaS page — verdicts speak first, proof on every screen, category's card-grid hero refused. OWN-WORLD: logo tile ground, gold authority, teal proof, Archivo Black display, JetBrains Mono data. STORY: visitor grasps seal-vs-file in one viewport, believes via runnable checks, acts via Verify/Seal. FIRST VIEWPORT: giant MATCH/TAMPERED pair over a sample seal card, primary Verify action. FORM: committed dark institutional, direction seed vdx-sealroom. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance */}
        <Header />
        <div className="flex-1">{children}</div>
          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2 px-6 py-6 font-hash text-xs text-dim">
              <span>Sepolia · {process.env.NEXT_PUBLIC_SBT_ADDRESS ?? "contract pending"}</span>
              <span>signedBy {process.env.NEXT_PUBLIC_SIGNER ?? "key pending"}</span>
              <span>OfferLetter/v1 demo schema</span>
            </div>
          </footer>
      </body>
    </html>
  );
}
