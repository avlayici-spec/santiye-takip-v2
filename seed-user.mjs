import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = "admin";

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const user = await prisma.user.create({
      data: {
        name: "Sistem Yöneticisi",
        username: adminUsername,
        password: "123", // İlk girişte değiştirilmesi önerilir
        jobTitle: "Kurucu / Yönetici",
        isAdmin: true,
        permissions: "{}", // Admin olduğu için permissions'a bakılmaz
      },
    });
    console.log(`✅ Admin kullanıcısı oluşturuldu!`);
    console.log(`Kullanıcı Adı: ${user.username}`);
    console.log(`Şifre: ${user.password}`);
  } else {
    console.log(`ℹ️ Admin kullanıcısı zaten mevcut: ${existingAdmin.username}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
