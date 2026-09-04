import { NextResponse } from "next/server";
import { fetchApi } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const endpoint = req.headers.get('x-upload-endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint não fornecido" }, { status: 400 });
    }

    // Proxy the form data to our NestJS backend
    // fetchApi automatically attaches the HttpOnly token
    const response = await fetchApi(`/upload/${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response || !response.url) {
       return NextResponse.json({ error: "Falha no upload" }, { status: 500 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Erro no proxy de upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
