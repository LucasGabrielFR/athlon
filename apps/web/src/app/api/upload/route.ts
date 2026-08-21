import { NextResponse } from "next/server";
import { generateUploadUrl } from "@/lib/storage";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    // 1. Validar autenticação (Apenas usuários logados podem fazer upload)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // 2. Extrair dados do arquivo
    const body = await req.json();
    const { fileName, contentType, folder } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Nome do arquivo e tipo MIME são obrigatórios." },
        { status: 400 }
      );
    }

    // 3. Validação de segurança básica: Apenas imagens
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Apenas upload de imagens é permitido." },
        { status: 400 }
      );
    }

    // 4. Validação do diretório alvo (Prevenir directory traversal / injeção)
    const allowedFolders = ['players', 'clubs', 'organizations', 'competitions', 'uploads', 'feed'];
    let safeFolder = allowedFolders.includes(folder) ? folder : 'uploads';

    if (folder === 'feed' && body.competitionId) {
      safeFolder = `feed/comp_${body.competitionId}`;
    }

    // 5. Gerar Presigned URL
    const { uploadUrl, fileKey, publicUrl } = await generateUploadUrl(
      fileName,
      contentType,
      safeFolder
    );

    return NextResponse.json({
      uploadUrl,
      fileKey,
      publicUrl,
    });
  } catch (error) {
    console.error("Erro ao gerar URL de upload:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
