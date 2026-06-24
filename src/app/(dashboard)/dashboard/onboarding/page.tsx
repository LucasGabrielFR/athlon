import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { completeOnboardingAction } from '@/app/actions/auth';
import { User, Shield } from 'lucide-react';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email)
  });

  if (!user) redirect('/login');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5 w-full max-w-md">
        <h1 className="text-2xl font-bold text-ice mb-2">Complete seu Perfil</h1>
        <p className="text-sm text-ice/50 mb-8">
          Notamos que você entrou com o Google. Por favor, defina como você vai usar o Athlon.
        </p>

        <form action={completeOnboardingAction} className="space-y-6">
          <div className="space-y-4">
            <label className="flex items-start gap-4 p-4 border border-azure/20 rounded-xl cursor-pointer hover:bg-slate-dark transition-colors has-[:checked]:border-azure has-[:checked]:bg-azure/5">
              <div className="mt-1">
                <input type="radio" name="role" value="player" className="w-4 h-4 text-azure" defaultChecked />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className="text-azure" />
                  <span className="font-bold text-ice">Sou Jogador / Dono de Time</span>
                </div>
                <p className="text-xs text-ice/60">Quero participar de torneios, criar meu clube e gerenciar meu elenco.</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-slate-dark transition-colors has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/5">
              <div className="mt-1">
                <input type="radio" name="role" value="org_president" className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} className="text-amber-500" />
                  <span className="font-bold text-ice">Sou uma Organização</span>
                </div>
                <p className="text-xs text-ice/60">Quero organizar torneios, criar federações e não pretendo jogar.</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Nickname (Opcional)</label>
            <input
              type="text"
              name="nickname"
              placeholder="FalleN"
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-azure text-navy font-bold py-3.5 rounded-xl hover:bg-ice transition-colors uppercase tracking-widest text-sm"
          >
            Salvar e Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
