/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onUploadSuccess?: (url: string) => void;
  defaultImage?: string | null;
  className?: string;
  label?: string;
  name?: string;
  folder?: 'players' | 'clubs' | 'organizations' | 'competitions' | 'uploads' | 'feed';
  competitionId?: number;
}

export function ImageUpload({ onUploadSuccess, defaultImage, className = "", label = "Fazer upload de imagem", name, folder = 'uploads', competitionId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);
  const [publicUrl, setPublicUrl] = useState<string | null>(defaultImage || null);
  const [error, setError] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas imagens.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setFileToUpload(file);
    setPublicUrl(null); // Reseta a URL pública anterior

    try {
      // 1. Pega URL assinada
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: folder,
          competitionId: competitionId,
        }),
      });

      if (!res.ok) throw new Error("Erro ao obter link de upload");
      const { uploadUrl, publicUrl: uploadedPublicUrl } = await res.json();

      // 2. Faz o PUT diretamente para o Cloudflare R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Erro ao enviar imagem para a nuvem");

      // 3. Sucesso!
      setPublicUrl(uploadedPublicUrl);
      if (onUploadSuccess) onUploadSuccess(uploadedPublicUrl);

      // Preenche o input oculto caso o React demore a reagir no submit
      if (name) {
        const hiddenInput = document.getElementById(`hidden-${name}`) as HTMLInputElement;
        if (hiddenInput) hiddenInput.value = uploadedPublicUrl;
      }
    } catch (err) {
      console.error(err);
      setError("Falha no upload. Tente novamente.");
    } finally {
      setIsUploading(false);
      setFileToUpload(null);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center border-2 border-dashed border-azure/20 bg-slate-dark/50 rounded-xl overflow-hidden group cursor-pointer transition-colors hover:border-azure hover:bg-slate-dark ${className}`} onClick={() => fileInputRef.current?.click()}>
      
      {previewUrl ? (
        <div className="absolute inset-0 w-full h-full">
          <Image src={previewUrl} alt="Preview" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" unoptimized />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-slate-900/80 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <UploadCloud size={16} /> Trocar Imagem
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-dark p-3 rounded-full mb-3 text-ice/60 group-hover:text-azure group-hover:bg-azure/10 transition-colors">
            <UploadCloud size={24} />
          </div>
          <p className="text-sm font-medium text-ice">{label}</p>
          <p className="text-xs text-ice/40 mt-1">JPEG, PNG ou WebP até 5MB</p>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <span className="text-sm font-medium text-white">Enviando...</span>
        </div>
      )}

      {error && (
        <div className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white text-xs p-2 rounded text-center z-20">
          {error}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {name && (
        <input type="hidden" id={`hidden-${name}`} name={name} value={publicUrl || ""} />
      )}
    </div>
  );
}
