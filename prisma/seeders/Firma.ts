import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class FirmaSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const filiales = await prisma.filial.findMany()
    for (let i = 1; i <= 3; i++) {
      for await (const filial of filiales) {
        await prisma.firma.upsert({
          where: {
            cargo_filialId: {
              cargo: `Cargo ${i}`,
              filialId: filial.id,
            },
          },
          update: {
            nombre: `Nombre ${i}`,
            posicion: i,
            filial: {
              connect: { id: filial.id },
            },
          },
          create: {
            nombre: `Nombre ${i}`,
            cargo: `Cargo ${i}`,
            posicion: i,
            filial: {
              connect: { id: filial.id },
            },
          },
        })
      }
    }
  }
}
