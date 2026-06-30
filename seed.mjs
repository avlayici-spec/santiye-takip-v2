import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı sıfırlanıyor ve örnek veriler yükleniyor...');

  // 1. Dinamik Kategoriler
  const catKaba = await prisma.expenseCategory.create({
    data: {
      name: 'Kaba İnşaat',
      color: 'blue',
      subCategories: {
        create: [
          { name: 'Demir' },
          { name: 'Beton' },
          { name: 'Tuğla / Gazbeton' },
          { name: 'Hafriyat' },
        ],
      },
    },
  });

  const catInce = await prisma.expenseCategory.create({
    data: {
      name: 'İnce İnşaat',
      color: 'green',
      subCategories: {
        create: [
          { name: 'Sıva / Alçıpan' },
          { name: 'Boya' },
          { name: 'Elektrik Tesisatı' },
        ],
      },
    },
  });

  const catIscilik = await prisma.expenseCategory.create({
    data: {
      name: 'İşçilik',
      color: 'amber',
      subCategories: {
        create: [
          { name: 'Kaba İnşaat İşçiliği' },
          { name: 'Taşeron Hakedişi' },
        ],
      },
    },
  });

  const catOfis = await prisma.expenseCategory.create({
    data: {
      name: 'Ofis & Genel Yönetim',
      color: 'red',
      subCategories: {
        create: [
          { name: 'Ofis Kirası' },
          { name: 'Personel Maaş & SGK' },
          { name: 'Elektrik' },
        ],
      },
    },
  });

  // 2. Ofis Personeli
  await prisma.staff.create({
    data: {
      firstName: 'Ali',
      lastName: 'Yılmaz',
      title: 'Şantiye Şefi',
      salary: 45000,
      insurancePremium: 15000,
      phone: '0532 111 22 33',
      address: 'Nilüfer, Bursa'
    }
  });

  await prisma.staff.create({
    data: {
      firstName: 'Ayşe',
      lastName: 'Kaya',
      title: 'Muhasebe Müdürü',
      salary: 35000,
      insurancePremium: 12000,
      phone: '0533 222 33 44',
      address: 'Osmangazi, Bursa'
    }
  });

  // 3. Proje ve Üniteler
  const project1 = await prisma.project.create({
    data: {
      name: 'Modern Apartman A Blok',
      type: 'Apartman',
      ownerName: 'Ahmet Yılmaz',
      municipality: 'Nilüfer',
      neighborhood: 'Özlüce',
      areaSize: 1200,
      estimatedCost: 25000000,
      estimatedEndDate: new Date('2026-12-30'),
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Koru Villaları',
      type: 'Villa',
      ownerName: 'Mehmet Demir',
      estimatedCost: 15000000,
      estimatedEndDate: new Date('2026-08-15'),
    }
  });

  // 4. Müşteri ve Satış
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Kemal Sunal',
      phone: '0555 999 88 77'
    }
  });

  const unit1 = await prisma.unit.create({
    data: {
      projectId: project1.id,
      unitNumber: '1',
      floorNumber: 'B1',
      type: '2+1',
      netArea: 85,
      status: 'SATILDI',
      salePrice: 4200000,
      customerId: customer1.id,
      saleDate: new Date(),
      paymentPlans: {
        create: [
          { amount: 2100000, isPaid: true, dueDate: new Date(), paidAmount: 2100000, paidDate: new Date() },
          { amount: 1050000, isPaid: false, dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) },
          { amount: 1050000, isPaid: false, dueDate: new Date(new Date().setMonth(new Date().getMonth() + 2)) },
        ]
      },
      commissions: {
        create: [
          { agentName: 'Remax - Ayşe Hanım', amount: 84000, isPaid: true, paymentDate: new Date() }
        ]
      }
    }
  });

  // 5. Taşeron Yönetimi
  const subContractor = await prisma.subcontractor.create({
    data: {
      name: 'Demirtaş Yapı / Ahmet Usta',
      contactPerson: 'Ahmet Demirtaş',
      phone: '0555 111 2233',
      specialty: 'Kaba İnşaat'
    }
  });

  const contract = await prisma.subcontractorContract.create({
    data: {
      projectId: project1.id,
      subcontractorId: subContractor.id,
      agreementType: 'TOTAL',
      totalAmount: 1500000,
      description: 'A Blok tüm kaba işçilik'
    }
  });

  // Fetch subcategory for Taşeron Hakedişi
  const subCatHakedis = await prisma.expenseSubCategory.findFirst({
    where: { name: 'Taşeron Hakedişi' }
  });

  const subPayment = await prisma.subcontractorPayment.create({
    data: {
      contractId: contract.id,
      amount: 250000,
      description: 'Temel ve 1. kat hakedişi',
      expense: {
        create: {
          projectId: project1.id,
          amount: 250000,
          categoryId: subCatHakedis?.categoryId,
          subCategoryId: subCatHakedis?.id,
          expenseType: 'SANTIYE',
          description: 'Temel ve 1. kat hakedişi (Taşeron: Demirtaş Yapı)',
        }
      }
    }
  });

  // 6. Genel Şantiye ve Ofis Giderleri
  const subCatDemir = await prisma.expenseSubCategory.findFirst({ where: { name: 'Demir' }});
  await prisma.expense.create({
    data: {
      projectId: project1.id,
      amount: 450000,
      categoryId: subCatDemir?.categoryId,
      subCategoryId: subCatDemir?.id,
      description: 'Temel demir alımı',
    }
  });

  const subCatKira = await prisma.expenseSubCategory.findFirst({ where: { name: 'Ofis Kirası' }});
  await prisma.expense.create({
    data: {
      // projectId is null => Merkez Ofis Gideri
      amount: 35000,
      categoryId: subCatKira?.categoryId,
      subCategoryId: subCatKira?.id,
      expenseType: 'OFIS',
      description: 'Nisan Ayı Ofis Kirası',
    }
  });

  console.log('Örnek veriler başarıyla yüklendi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
