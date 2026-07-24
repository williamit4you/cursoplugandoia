import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if there are any ColetaDadosShoppe referencing this persona
    const count = await prisma.coletaDadosShoppe.count({
      where: { creatorPersonaId: id }
    });

    if (count > 0) {
      return NextResponse.json({ error: "Este vendedor não pode ser deletado pois já está associado a coletas da Shopee." }, { status: 400 });
    }

    await prisma.creatorPersona.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
