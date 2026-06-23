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
  folder?: 'players' | 'clubs' | 'organizations' | 'competitions' | 'uploads';
}

export function ImageUpload({ onUploadSuccess, defaultImage, className = "", label = "Fazer upload de imagem", name, folder = 'uploads' }: ImageUploadProps) {
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

    // Apenas cria o preview local e salva o arquivo em estado
    // O upload real acontecerá quando o usuário enviar o formulário
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setFileToUpload(file);
    setPublicUrl(null); // Reseta a URL pública anterior
  };

  React.useEffect(() => {
    const form = fileInputRef.current?.closest("form");
    if (!form) return;

    const handleFormSubmit = async (e: Event) => {
      // Se não há um novo arquivo selecionado, permite o envio normal do form
      if (!fileToUpload) return;

      // Impede o formulário de ser enviado imediatamente
      e.preventDefault();

      if (isUploading) return;

      setIsUploading(true);
      setError(null);

      try {
        // 1. Pega URL assinada
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: fileToUpload.name,
            contentType: fileToUpload.type,
            folder: folder,
          }),
        });

        if (!res.ok) throw new Error("Erro ao obter link de upload");
        const { uploadUrl, publicUrl: uploadedPublicUrl } = await res.json();

        // 2. Faz o PUT diretamente para o Cloudflare R2
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": fileToUpload.type },
          body: fileToUpload,
        });

        if (!uploadRes.ok) throw new Error("Erro ao enviar imagem para a nuvem");

        // 3. Sucesso! Repassa a URL pública
        setPublicUrl(uploadedPublicUrl);
        setFileToUpload(null); // Limpa o arquivo para evitar loop no próximo submit
        if (onUploadSuccess) onUploadSuccess(uploadedPublicUrl);

        // Atualiza o input hidden no DOM imediatamente antes de re-submeter
        if (name) {
          const hiddenInput = document.getElementById(`hidden-${name}`) as HTMLInputElement;
          if (hiddenInput) hiddenInput.value = uploadedPublicUrl;
        }

        // Re-submete o formulário programaticamente (agora com fileToUpload == null)
        form.requestSubmit();

      } catch (err) {
        console.error(err);
        setError("Falha no upload. Tente novamente.");
        setIsUploading(false);
      }
    };

    form.addEventListener("submit", handleFormSubmit);
    return () => form.removeEventListener("submit", handleFormSubmit);
  }, [fileToUpload, isUploading, name, onUploadSuccess]);

  return (
    <div className={`relative flex flex-col items-center justify-center border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-xl overflow-hidden group cursor-pointer transition-colors hover:border-blue-500 hover:bg-slate-800 ${className}`} onClick={() => fileInputRef.current?.click()}>
      
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
          <div className="bg-slate-700/50 p-3 rounded-full mb-3 text-slate-300 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
            <UploadCloud size={24} />
          </div>
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="text-xs text-slate-400 mt-1">JPEG, PNG ou WebP até 5MB</p>
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
