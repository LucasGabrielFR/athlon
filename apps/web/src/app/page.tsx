import Link from 'next/link';
import { Trophy, Shield, Zap, Target, BarChart2, Users } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/auth';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-navy text-ice selection:bg-azure selection:text-navy overflow-hidden font-sans">
      
      {/* Background Subtle Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-azure/10 rounded-full blur-[150px] mix-blend-screen transform -translate-y-1/2"></div>
      </div>

      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-azure/10 bg-navy/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo/athlon-padrao-sem-bg.png" alt="Athlon" className="h-8 w-auto" />
          </div>
          <nav className="flex items-center gap-6">
            <ThemeToggle />
            {session ? (
              <Link href="/dashboard" className="text-sm font-bold bg-azure text-navy px-6 py-2.5 rounded-sm hover:bg-ice transition-all uppercase tracking-widest">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-ice/70 hover:text-azure transition-colors uppercase tracking-widest">
                  Acessar
                </Link>
                <Link href="/register" className="text-sm font-bold bg-azure text-navy px-6 py-2.5 rounded-sm hover:bg-ice transition-all uppercase tracking-widest">
                  Criar Conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-azure/30 bg-azure/5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Zap size={14} className="text-azure" />
            <span className="text-xs font-bold uppercase tracking-widest text-azure">Pronto para a Temporada 2026</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            DOMINE O <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-azure to-blue-500">
              COMPETITIVO
            </span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-ice/60 mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            O motor absoluto para campeonatos. Da várzea aos E-sports, controle chaves, fases de grupos, estatísticas e súmulas com precisão profissional.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <Link 
              href={session ? "/dashboard" : "/register"} 
              className="h-14 px-8 flex items-center justify-center bg-azure text-navy font-black text-sm uppercase tracking-widest rounded-sm hover:scale-105 transition-transform"
            >
              {session ? "Ir para o Dashboard" : "Começar Agora"}
            </Link>
            <a 
              href="#recursos" 
              className="h-14 px-8 flex items-center justify-center border border-azure/30 text-ice font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-azure/5 transition-colors"
            >
              Explorar Recursos
            </a>
          </div>
        </section>

        {/* NARRATIVE SECTION (FEATURES) */}
        <section id="recursos" className="max-w-7xl mx-auto px-6 py-32 border-t border-azure/10">
          <div className="mb-24">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">O FIM DAS PLANILHAS.</h2>
            <p className="text-xl text-ice/50 max-w-2xl leading-relaxed">
              Esqueça as gambiarras. O Athlon oferece uma arquitetura robusta para que sua única preocupação seja o desempenho no jogo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Feature 1 - Large Span */}
            <div className="lg:col-span-8 group bg-slate-dark/50 border border-azure/20 p-10 md:p-16 hover:border-azure transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-azure/10 rounded-none border border-azure/30 flex items-center justify-center mb-8">
                  <Trophy className="text-azure" size={24} />
                </div>
                <h3 className="text-2xl md:text-4xl font-black mb-4">Motor Multi-Modalidade</h3>
                <p className="text-ice/60 text-lg leading-relaxed max-w-lg">
                  Futebol, CS2, Valorant ou Xadrez. O sistema se adapta. Configure formatos de Mata-mata, Grupos, Eliminação Dupla ou Pontos Corridos.
                </p>
              </div>
            </div>

            {/* Feature 2 - Small Span */}
            <div className="lg:col-span-4 bg-slate-dark/50 border border-azure/20 p-10 md:p-16 hover:border-azure transition-colors flex flex-col justify-end">
              <div className="w-12 h-12 bg-azure/10 rounded-none border border-azure/30 flex items-center justify-center mb-8">
                <Shield className="text-azure" size={24} />
              </div>
              <h3 className="text-2xl font-black mb-4">Súmulas PRO</h3>
              <p className="text-ice/60 leading-relaxed">
                Auditoria rigorosa de resultados. Exija screenshots, aprove resultados bilateralmente e acabe com os W.O. falsos.
              </p>
            </div>

            {/* Feature 3 - Small Span */}
            <div className="lg:col-span-4 bg-slate-dark/50 border border-azure/20 p-10 md:p-16 hover:border-azure transition-colors flex flex-col justify-end">
              <div className="w-12 h-12 bg-azure/10 rounded-none border border-azure/30 flex items-center justify-center mb-8">
                <Users className="text-azure" size={24} />
              </div>
              <h3 className="text-2xl font-black mb-4">Gestão de Clubes</h3>
              <p className="text-ice/60 leading-relaxed">
                Controle de elenco, presidência, inscrições automáticas em campeonatos e vitrine de jogadores.
              </p>
            </div>

            {/* Feature 4 - Large Span */}
            <div className="lg:col-span-8 bg-slate-dark/50 border border-azure/20 p-10 md:p-16 hover:border-azure transition-colors">
              <div className="w-12 h-12 bg-azure/10 rounded-none border border-azure/30 flex items-center justify-center mb-8">
                <BarChart2 className="text-azure" size={24} />
              </div>
              <h3 className="text-2xl md:text-4xl font-black mb-4">Estatísticas Granulares</h3>
              <p className="text-ice/60 text-lg leading-relaxed max-w-lg">
                Dicionário de dados flexível. Acompanhe Kills, Mortes, Gols, Assistências ou qualquer métrica que o seu esporte exigir. Leaderboards em tempo real.
              </p>
            </div>

          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="bg-azure text-navy p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Target size={48} className="mb-8" />
              <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">Assuma o Controle</h2>
              <p className="text-xl font-medium opacity-80 mb-12 max-w-2xl">
                Junte-se às organizações que já migraram para a plataforma definitiva de gestão de campeonatos.
              </p>
              <Link 
                href={session ? "/dashboard" : "/register"} 
                className="h-16 px-12 flex items-center justify-center bg-navy text-azure font-black text-lg uppercase tracking-widest hover:bg-slate-dark transition-colors shadow-2xl"
              >
                {session ? "Acessar Meu Painel" : "Criar Minha Conta Grátis"}
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-azure/10 bg-navy">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo/athlon-padrao-sem-bg.png" alt="Athlon" className="h-6 w-auto opacity-50" />
            <span className="text-ice/30 text-sm font-bold uppercase tracking-widest">© 2026 Athlon System</span>
          </div>
          <div className="flex items-center gap-6">
            {session ? (
              <Link href="/dashboard" className="text-ice/30 hover:text-azure text-xs font-bold uppercase tracking-widest transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-ice/30 hover:text-azure text-xs font-bold uppercase tracking-widest transition-colors">Login</Link>
                <Link href="/register" className="text-ice/30 hover:text-azure text-xs font-bold uppercase tracking-widest transition-colors">Registro</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
