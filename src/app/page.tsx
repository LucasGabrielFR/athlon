export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-navy text-ice animate-in fade-in duration-1000">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex mb-20">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-azure/20 bg-navy/80 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:p-4">
          Athlon: O elo entre o esporte real e o digital.
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        <h1 className="text-6xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-ice to-azure">
          ATHLON
        </h1>
        <p className="text-xl text-azure font-medium mb-12 uppercase tracking-widest">
          Motor de Competições Modular
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
          <div className="p-6 bg-slate rounded-lg border border-azure/20 hover:border-azure transition-colors group">
            <h3 className="text-xl font-bold mb-2 group-hover:text-azure">Performance Real</h3>
            <p className="text-sm opacity-70">Acompanhe estatísticas, vitórias e marcos competitivos em um só lugar.</p>
          </div>
          <div className="p-6 bg-slate rounded-lg border border-azure/20 hover:border-azure transition-colors group">
            <h3 className="text-xl font-bold mb-2 group-hover:text-azure">E-sports & Várzea</h3>
            <p className="text-sm opacity-70">Agnóstico à modalidade. Configure regras para qualquer tipo de disputa.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-20 opacity-30 text-xs">
        © 2026 Athlon System | Powered by Antigravity
      </div>
    </main>
  );
}
