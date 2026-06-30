import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log(`🔍 Toplam ${users.length} kullanıcı kontrol ediliyor...`);

    let updatedCount = 0;
    for (const user of users) {
      if (!user.password.includes(":")) {
        console.log(`⚙️ "${user.name}" (@${user.username}) şifresi hash'leniyor...`);
        const hashedPassword = hashPassword(user.password);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        updatedCount++;
      } else {
        console.log(`✅ "${user.name}" (@${user.username}) şifresi zaten güvenli.`);
      }
    }

    console.log(`🎉 Başarıyla ${updatedCount} kullanıcının şifresi güvenli hale getirildi!`);
  } catch (error) {
    console.error("❌ Hata oluştu:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
