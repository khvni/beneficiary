import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@myfundaction.org' },
    update: {},
    create: {
      email: 'admin@myfundaction.org',
      name: 'Admin User',
      password: await hash('admin123', 10),
      role: 'ADMIN',
      phone: '+60123456789',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@myfundaction.org' },
    update: {},
    create: {
      email: 'staff@myfundaction.org',
      name: 'Staff User',
      password: await hash('staff123', 10),
      role: 'STAFF',
      phone: '+60123456788',
    },
  });

  const fieldWorker = await prisma.user.upsert({
    where: { email: 'fieldworker@myfundaction.org' },
    update: {},
    create: {
      email: 'fieldworker@myfundaction.org',
      name: 'Field Worker',
      password: await hash('field123', 10),
      role: 'FIELD_WORKER',
      phone: '+60123456787',
    },
  });

  console.log('✅ Created users:', {
    admin: adminUser.email,
    staff: staffUser.email,
    fieldWorker: fieldWorker.email,
  });

  // Create sample beneficiaries
  const beneficiary1 = await prisma.beneficiary.create({
    data: {
      firstName: 'Ahmad',
      lastName: 'Abdullah',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'MALE',
      nationality: 'Malaysian',
      phone: '+60123456786',
      address: 'Jalan Sultan Ismail',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      postcode: '50250',
      category: 'HOMELESS',
      status: 'ACTIVE',
      priority: 'HIGH',
      notes: 'Requires immediate shelter assistance',
      tags: ['homeless', 'male', 'kl'],
      source: 'manual_entry',
      createdById: staffUser.id,
    },
  });

  const beneficiary2 = await prisma.beneficiary.create({
    data: {
      firstName: 'Siti',
      lastName: 'Nurhaliza',
      dateOfBirth: new Date('1978-01-11'),
      gender: 'FEMALE',
      nationality: 'Malaysian',
      phone: '+60123456785',
      address: 'Taman Melati',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      postcode: '53100',
      category: 'ELDERLY',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      notes: 'Needs regular food assistance',
      tags: ['elderly', 'female', 'food'],
      source: 'referral',
      createdById: fieldWorker.id,
    },
  });

  console.log('✅ Created beneficiaries:', {
    beneficiary1: `${beneficiary1.firstName} ${beneficiary1.lastName}`,
    beneficiary2: `${beneficiary2.firstName} ${beneficiary2.lastName}`,
  });

  // Create sample cases
  const case1 = await prisma.case.create({
    data: {
      title: 'Emergency Shelter Required',
      description: 'Beneficiary requires immediate temporary shelter accommodation',
      type: 'SHELTER',
      priority: 'HIGH',
      status: 'OPEN',
      beneficiaryId: beneficiary1.id,
      createdById: staffUser.id,
    },
  });

  const case2 = await prisma.case.create({
    data: {
      title: 'Monthly Food Aid',
      description: 'Regular food package distribution for elderly beneficiary',
      type: 'FOOD',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      beneficiaryId: beneficiary2.id,
      createdById: fieldWorker.id,
    },
  });

  console.log('✅ Created cases:', {
    case1: case1.title,
    case2: case2.title,
  });

  // Create sample services
  const service1 = await prisma.service.create({
    data: {
      type: 'SHELTER_ADMISSION',
      date: new Date(),
      description: 'Admitted to temporary shelter for 7 days',
      quantity: 7,
      beneficiaryId: beneficiary1.id,
      caseId: case1.id,
      providedById: staffUser.id,
      location: 'MyFundAction Shelter KL',
      notes: 'Shelter admission completed successfully',
    },
  });

  const service2 = await prisma.service.create({
    data: {
      type: 'FOOD_DISTRIBUTION',
      date: new Date(),
      description: 'Distributed monthly food package',
      quantity: 1,
      beneficiaryId: beneficiary2.id,
      caseId: case2.id,
      providedById: fieldWorker.id,
      location: 'Taman Melati Distribution Center',
      notes: 'Food package includes rice, oil, and canned goods',
    },
  });

  console.log('✅ Created services:', {
    service1: service1.type,
    service2: service2.type,
  });

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest Credentials:');
  console.log('==================');
  console.log('Admin:');
  console.log('  Email: admin@myfundaction.org');
  console.log('  Password: admin123');
  console.log('\nStaff:');
  console.log('  Email: staff@myfundaction.org');
  console.log('  Password: staff123');
  console.log('\nField Worker:');
  console.log('  Email: fieldworker@myfundaction.org');
  console.log('  Password: field123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
