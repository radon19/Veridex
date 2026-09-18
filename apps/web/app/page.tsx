// Landing — 8 lines + Issue/Verify, no wallet modal
export default function Home() {
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-7xl font-black">Veridex</h1>
      <p className="text-xl mt-4">The token is a seal. The file stays off-chain.</p>
      <p className="mt-2">Forwarded PDFs get edited. We seal bytes to one address.</p>
      <div className="flex gap-4 mt-8">
        <a href="/issuer" className="bg-black text-white px-8 py-4 text-xl">Issue</a>
        <a href="/verify" className="border px-8 py-4 text-xl">Verify</a>
      </div>
      <footer className="text-xs mt-16 opacity-60">Sepolia · {process.env.NEXT_PUBLIC_SBT_ADDRESS} · signedBy {process.env.NEXT_PUBLIC_SIGNER}</footer>
    </main>
  );
}
