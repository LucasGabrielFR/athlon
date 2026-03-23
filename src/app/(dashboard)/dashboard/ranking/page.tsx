import { auth } from '@/auth';
import { db } from '@/db';
import { clubs, users, modalities } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Trophy, Star, Shield, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default async function RankingPage() {
  const session = await auth();
  const allClubs = await db.query.clubs.findMany({
    orderBy: [desc(clubs.prestigePoints)],
    with: {
      modality: true,
      president: true
    }
  });

  return (
    <div className="space-y-10 pb-20">
      <div className="relative h-64 rounded-[2.5rem] overflow-hidden border border-azure/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-slate via-slate/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1973&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-azure/5 backdrop-blur-[2px]"></div>
        
        <div className="absolute bottom-10 left-10 z-20">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="text-amber-500" size={32} />
            <h1 className="text-5xl font-black text-ice tracking-tighter italic leading-none uppercase">Ranking Global</h1>
          </div>
          <p className="text-ice/60 text-sm font-bold uppercase tracking-widest italic ml-1">Os maiores clubes do Athlon se encontram aqui</p>
        </div>
      </div>

      <div className="bg-slate border border-azure/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-azure/5 bg-slate-dark/30 flex items-center justify-between">
          <div className="flex gap-10">
            <div className="text-center">
              <p className="text-[10px] text-ice/20 font-black uppercase tracking-widest mb-1 italic">Total Clubes</p>
              <p className="text-xl font-black text-ice italic">{allClubs.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-azure/10 rounded-xl border border-azure/20">
            <Star size={14} className="text-azure animate-pulse" />
            <span className="text-[10px] font-black text-azure uppercase tracking-widest italic">Pontos de Prestígio</span>
          </div>
        </div>

        <div className="divide-y divide-azure/5">
          {allClubs.map((club, i) => (
            <div key={club.id} className="group hover:bg-azure/5 transition-all flex items-center justify-between p-8">
              <div className="flex items-center gap-10">
                <span className={`text-4xl font-black italic w-12 text-center ${
                  i === 0 ? 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 
                  i === 1 ? 'text-slate-light' : 
                  i === 2 ? 'text-amber-700' : 'text-ice/10'
                }`}>
                  {i + 1}
                </span>
                
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 bg-azure rounded-[1.5rem] flex items-center justify-center font-black text-2xl text-slate shadow-2xl shadow-azure/20 group-hover:scale-105 transition-transform italic relative overflow-hidden">
                    {club.tag}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-ice italic tracking-tighter leading-none">{club.name}</h3>
                      <span className="text-[9px] bg-slate-dark border border-azure/20 text-azure px-2 py-0.5 rounded-md font-black uppercase italic tracking-widest">{club.modality?.name}</span>
                    </div>
                    <p className="text-[10px] text-ice/40 uppercase font-black tracking-widest mt-2 italic flex items-center gap-2">
                       <Shield size={10} /> Presidido por {club.president?.name || 'Sistema'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <p className="text-4xl font-black text-azure italic leading-none drop-shadow-[0_0_15px_rgba(0,163,255,0.3)]">{club.prestigePoints}</p>
                  <p className="text-[10px] text-ice/20 uppercase font-black tracking-[0.2em] mt-2 italic">Prestígio</p>
                </div>
                <Link 
                  href={`/dashboard/clubs/${club.id}`}
                  className="h-12 w-12 bg-slate-dark border border-azure/10 rounded-2xl flex items-center justify-center text-ice/40 hover:text-azure hover:border-azure transition-all group/btn shadow-xl"
                >
                  <ArrowUpRight size={20} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
          
          {allClubs.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-ice/20 font-black uppercase tracking-[0.5em] italic">Nenhum clube ranqueado ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
