import { auth } from '@/auth';
import { db } from '@/db';
import { competitions } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function CompetitionsListPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  const allCompetitions = await db.query.competitions.findMany({
    orderBy: [desc(competitions.createdAt)],
    with: { modality: true, organization: true }
  });

  const canCreate = role === 'admin' || role === 'org_president';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-ice tracking-tight">Cenário <span className="text-azure">Competitivo</span></h2>
          <p className="text-ice/40 mt-1">Descubra os maiores torneios e inscreva sua equipe.</p>
        </div>
        {canCreate && (
          <Link 
            href="/dashboard/competitions/new"
            className="bg-azure hover:bg-azure-dark text-slate font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-azure/20 flex items-center gap-2 text-sm uppercase tracking-tighter"
          >
            <span>🏆</span> Organizar Torneio
          </Link>
        )}
      </div>

      {allCompetitions.length === 0 ? (
        <div className="bg-slate border border-azure/10 rounded-3xl p-20 text-center flex flex-col items-center justify-center shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-azure/20 to-transparent"></div>
          <span className="text-6xl mb-6 grayscale opacity-30 group-hover:grayscale-0 transition-all">🏆</span>
          <h3 className="text-ice font-black text-2xl mb-3 tracking-tighter">O silêncio antes da glória</h3>
          <p className="text-ice/40 max-w-sm mb-10 italic text-sm leading-relaxed">
            Ainda não há competições ativas na plataforma. Seja o primeiro a agitar o cenário e crie sua própria história.
          </p>
          {canCreate && (
            <Link 
              href="/dashboard/competitions/new"
              className="text-azure hover:text-ice text-sm font-bold border border-azure/20 px-8 py-3 rounded-xl transition-all hover:bg-azure/5"
            >
              Começar Agora
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allCompetitions.map((comp) => (
            <Link 
              key={comp.id} 
              href={`/dashboard/competitions/${comp.id}`}
              className="bg-slate border border-azure/10 rounded-2xl overflow-hidden hover:border-azure/40 transition-all group flex flex-col relative"
            >
              <div className="h-40 bg-[url('https://images.unsplash.com/photo-1541250848049-b4f71413cc30?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700">
                 <div className="absolute inset-0 bg-gradient-to-t from-slate via-slate/60 to-transparent"></div>
                 <div className="absolute top-4 right-4 bg-slate/80 backdrop-blur-md border border-azure/20 px-2 py-1 rounded text-[10px] text-azure font-black uppercase tracking-widest">
                   {comp.status === 'registration' ? 'Inscrições' : comp.status}
                 </div>
              </div>
              
              <div className="p-6 relative">
                <div className="flex items-center gap-2 mb-3">
                   <span className="text-[10px] text-azure font-black tracking-[0.2em] uppercase">{comp.modality?.name}</span>
                   <span className="text-[10px] text-ice/20">•</span>
                   <span className="text-[10px] text-ice/40 font-bold uppercase tracking-widest">{comp.format === 'knockout' ? 'Mata-mata' : 'Pontos Corridos'}</span>
                </div>
                <h3 className="text-xl font-black text-ice group-hover:text-azure transition-colors mb-2 tracking-tight line-clamp-1">{comp.name}</h3>
                <p className="text-ice/40 text-[10px] font-bold uppercase tracking-widest mb-6 line-clamp-1">
                  Org: <span className="text-azure">{comp.organization?.name}</span>
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-azure/5">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-ice/30 uppercase font-bold tracking-widest">Inscrição</span>
                      <span className="text-sm font-black text-ice">{comp.entryFee === 0 ? 'FREE' : `$${comp.entryFee}`}</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-[10px] text-ice/30 uppercase font-bold tracking-widest">Premiação</span>
                      <span className="text-sm font-black text-emerald-400">{comp.prizePool === 0 ? 'Glória' : `$${comp.prizePool}`}</span>
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
