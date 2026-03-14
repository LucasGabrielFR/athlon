'use client';

import { createOrganizationAction } from '@/app/actions/organizations';
import Link from 'next/link';
import { useState } from 'react';

export default function NewOrganizationPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link 
        href="/dashboard/organizations"
        className="text-azure hover:text-ice text-sm font-bold flex items-center gap-2 mb-8 transition-colors"
      >
        <span>←</span> Voltar para Organizações
      </Link>

      <div className="bg-slate border border-azure/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-azure/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-azure/5 blur-[100px] rounded-full"></div>

        <div className="relative">
          <h2 className="text-3xl font-black text-ice mb-2">Fundar <span className="text-azure">Organização</span></h2>
          <p className="text-ice/40 mb-10 leading-relaxed italic text-sm">
            Crie a estrutura administrativa que governará suas competições. Defina a identidade da sua organização.
          </p>

          <form action={async (formData) => {
            setLoading(true);
            try {
              await createOrganizationAction(formData);
            } catch (error) {
              setLoading(false);
              console.error(error);
            }
          }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1" htmlFor="name">Nome da Organização</label>
              <input 
                id="name"
                name="name"
                type="text"
                placeholder="Ex: Federação Pro de Futebol"
                required
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3.5 text-ice placeholder:text-ice/10 focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure/30 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1" htmlFor="tag">TAG (Máx 10)</label>
                <input 
                  id="tag"
                  name="tag"
                  type="text"
                  placeholder="Ex: FPF"
                  maxLength={10}
                  required
                  className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3.5 text-ice placeholder:text-ice/10 focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure/30 transition-all font-bold uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1" htmlFor="logoUrl">URL do Logo (Opcional)</label>
                <input 
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  placeholder="https://..."
                  className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3.5 text-ice placeholder:text-ice/10 focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure/30 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1" htmlFor="description">Descrição / Declaração de Missão</label>
              <textarea 
                id="description"
                name="description"
                rows={4}
                placeholder="Qual o propósito desta federação?"
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3.5 text-ice placeholder:text-ice/10 focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure/30 transition-all resize-none font-medium italic text-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-azure/10 ${
                loading 
                  ? 'bg-azure/50 text-slate cursor-not-allowed' 
                  : 'bg-azure hover:bg-azure-dark text-slate hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {loading ? 'Processando Fundação...' : 'Fundar Organização Agora'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
