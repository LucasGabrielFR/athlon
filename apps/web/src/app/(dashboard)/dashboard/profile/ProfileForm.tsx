'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateProfileAction } from '@/app/actions/profile';
import { ImageUpload } from '@/components/ui/image-upload';

export default function ProfileForm({ user, profile }: { user: any; profile: any }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state?.timestamp]);

  return (
    <div className="bg-slate rounded-xl border border-azure/10 p-6">
      <h3 className="text-ice font-bold text-lg mb-5">Dados Pessoais</h3>
      
      {state?.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {state.error}
        </div>
      )}
      
      {showSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          Perfil atualizado com sucesso!
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Nome Completo <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="name"
              defaultValue={user?.name ?? ''}
              required
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Nickname <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="nickname"
              defaultValue={user?.nickname ?? ''}
              required
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Data de Nascimento <span className="text-red-400">*</span></label>
            <input
              type="date"
              name="birthDate"
              defaultValue={user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''}
              required
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Localização</label>
            <input
              type="text"
              name="location"
              defaultValue={user?.location ?? ''}
              placeholder="Ex: São Paulo, SP"
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={profile?.bio ?? ''}
            placeholder="Conte um pouco sobre você..."
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors resize-none"
          />
        </div>
        
        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Foto de Perfil</label>
          <ImageUpload 
            name="avatarUrl" 
            defaultImage={profile?.avatarUrl} 
            label="Enviar foto" 
            className="h-32 rounded-lg w-full" 
            folder="players"
          />
        </div>
        
        <button
          type="submit"
          disabled={isPending}
          className="bg-azure text-navy font-bold px-6 py-2.5 rounded-lg hover:bg-ice transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}
