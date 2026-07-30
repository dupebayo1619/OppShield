const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // ─── Org A Users ───────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@opsshield.io' },
    update: {
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
    create: {
      email: 'admin@opsshield.io',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@opsshield.io' },
    update: {
      passwordHash,
      firstName: 'Team',
      lastName: 'Member',
      role: 'member',
    },
    create: {
      email: 'member@opsshield.io',
      passwordHash,
      firstName: 'Team',
      lastName: 'Member',
      role: 'member',
    },
  });

  // ─── Org B Users (dedicated — kept separate from Org A) ─────────
  const adminB = await prisma.user.upsert({
    where: { email: 'admin-b@opsshield.io' },
    update: {
      passwordHash,
      firstName: 'Admin',
      lastName: 'B',
      role: 'admin',
    },
    create: {
      email: 'admin-b@opsshield.io',
      passwordHash,
      firstName: 'Admin',
      lastName: 'B',
      role: 'admin',
    },
  });

  const memberB = await prisma.user.upsert({
    where: { email: 'member-b@opsshield.io' },
    update: {
      passwordHash,
      firstName: 'Team',
      lastName: 'MemberB',
      role: 'member',
    },
    create: {
      email: 'member-b@opsshield.io',
      passwordHash,
      firstName: 'Team',
      lastName: 'MemberB',
      role: 'member',
    },
  });

  // ─── Organization A: Acme Corp ────────────────────────────────
  const orgA = await prisma.organisation.upsert({
    where: { slug: 'acme-corp-dev' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp-dev',
      plan: 'FREE',
    },
  });

  // Explicitly upsert memberships — works whether orgA is new or existing
  await prisma.member.upsert({
    where: { userId_organisationId: { userId: admin.id, organisationId: orgA.id } },
    update: {},
    create: { userId: admin.id, organisationId: orgA.id, role: 'ADMIN' },
  });
  await prisma.member.upsert({
    where: { userId_organisationId: { userId: member.id, organisationId: orgA.id } },
    update: {},
    create: { userId: member.id, organisationId: orgA.id, role: 'MEMBER' },
  });

  // ─── Organization B ──────────────────────────────────────────
  const orgB = await prisma.organisation.upsert({
    where: { slug: 'org-b' },
    update: {},
    create: {
      name: 'Organization B',
      slug: 'org-b',
      plan: 'FREE',
    },
  });

  // Explicitly upsert memberships — this is what was missing before
  await prisma.member.upsert({
    where: { userId_organisationId: { userId: adminB.id, organisationId: orgB.id } },
    update: {},
    create: { userId: adminB.id, organisationId: orgB.id, role: 'ADMIN' },
  });
  await prisma.member.upsert({
    where: { userId_organisationId: { userId: memberB.id, organisationId: orgB.id } },
    update: {},
    create: { userId: memberB.id, organisationId: orgB.id, role: 'MEMBER' },
  });

  console.log('✅ Org A — admin@opsshield.io / Password123!');
  console.log('✅ Org A — member@opsshield.io / Password123!');
  console.log('✅ Org B — admin-b@opsshield.io / Password123!');
  console.log('✅ Org B — member-b@opsshield.io / Password123!');
  console.log('✅ Organizations: Acme Corp (Org A), Organization B');

  // ─── Sample Tasks for Org A ─────────────────────────────────────
  const existingOrgATasks = await prisma.task.count({ where: { organisationId: orgA.id } });
  if (existingOrgATasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: 'Set up cloud infrastructure',
          description: 'Provision VPC, ECS, and RDS via Terraform',
          status: 'IN_PROGRESS',
          requiresApproval: false,
          organisationId: orgA.id,
          createdById: admin.id,
          assignedToId: member.id,
        },
        {
          title: 'Complete threat model',
          description: 'STRIDE threat model for all MVP features',
          status: 'AWAITING_APPROVAL',
          requiresApproval: true,
          organisationId: orgA.id,
          createdById: member.id,
          assignedToId: admin.id,
        },
        {
          title: 'Integrate Paystack billing',
          description: 'Webhook handler, plan upgrade, billing history',
          status: 'PENDING',
          requiresApproval: false,
          organisationId: orgA.id,
          createdById: admin.id,
        },
      ],
    });
    console.log('✅ Org A tasks created');
  } else {
    console.log(`ℹ️ Org A already has ${existingOrgATasks} tasks (skipping)`);
  }

  // ─── Sample Tasks for Org B ─────────────────────────────────────
  const existingOrgBTasks = await prisma.task.count({ where: { organisationId: orgB.id } });
  if (existingOrgBTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: 'Draft Org B onboarding doc',
          description: 'Write onboarding steps for new Org B members',
          status: 'PENDING',
          requiresApproval: false,
          organisationId: orgB.id,
          createdById: adminB.id,
        },
        {
          title: 'Review Org B security policy',
          description: 'Check access control policy for Org B resources',
          status: 'IN_PROGRESS',
          requiresApproval: true,
          organisationId: orgB.id,
          createdById: adminB.id,
          assignedToId: memberB.id,
        },
      ],
    });
    console.log('✅ Org B tasks created');
  } else {
    console.log(`ℹ️ Org B already has ${existingOrgBTasks} tasks (skipping)`);
  }

  console.log('🌱 Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
