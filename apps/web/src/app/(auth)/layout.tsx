export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-navy p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/logo/athlon-padrao-sem-bg.png" 
            alt="Athlon Logo" 
            className="h-16 w-auto mb-2"
          />
          <p className="text-sm text-azure/70 tracking-widest uppercase">Motor de Competições</p>
        </div>
        {children}
      </div>
    </main>
  );
}
