/**
 * Crée/actualise les comptes utilisateurs de base. À rejouer sans risque
 * (upsert) — utile après un `prisma db push` sur un nouvel environnement.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const USERS: { username: string; password: string; role: "admin" | "restricted" }[] = [
  { username: "Rafik", password: "RenovMidi13820", role: "admin" },
  { username: "christophe", password: "RenovMidi13820", role: "admin" },
  { username: "Com", password: "Com13", role: "restricted" },
];

async function main() {
  for (const u of USERS) {
    const passwordHash = await hashPassword(u.password);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, role: u.role },
      create: { username: u.username, passwordHash, role: u.role },
    });
    console.log(`Compte prêt : ${u.username} (${u.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
