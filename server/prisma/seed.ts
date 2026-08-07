/**
 * Database seed script.
 * Initializes roles, admin user, after-sales staff, customers, and contacts.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** All permission codes used in the system. */
const ALL_PERMISSIONS = [
  'workorder:create',
  'workorder:read',
  'workorder:update',
  'workorder:delete',
  'staff:read',
  'staff:manage',
  'customer:read',
  'customer:manage',
  'summary:view',
  'payment:manage',
  'user:manage',
  'role:manage',
];

/** Role seed definitions with their permission sets. */
const ROLES = [
  {
    name: '管理员',
    description: '系统最高权限角色，拥有全部功能模块的访问和操作权限',
    permissions: ALL_PERMISSIONS,
  },
  {
    name: '售后主管',
    description: '售后团队管理者，可查看和管理全部工单及基础数据',
    permissions: [
      'workorder:create',
      'workorder:read',
      'workorder:update',
      'customer:read',
      'staff:read',
      'summary:view',
    ],
  },
  {
    name: '售后人员',
    description: '一线售后工程师，可录入和查看自己参与的工单',
    permissions: [
      'workorder:create',
      'workorder:read',
      'workorder:update',
      'summary:view',
    ],
  },
  {
    name: '财务人员',
    description: '负责费用核算与结款管理',
    permissions: [
      'workorder:read',
      'customer:read',
      'staff:read',
      'summary:view',
      'payment:manage',
    ],
  },
];

/** After-sales staff seed data. */
const STAFF_SEED = [
  { name: '张伟', phone: null },
  { name: '李娜', phone: null },
  { name: '王强', phone: null },
  { name: '刘敏', phone: null },
];

/** Customer seed data with their contacts. */
const CUSTOMER_SEED = [
  {
    name: '华为技术有限公司',
    contacts: [
      { name: '周工', phone: '13800010001' },
      { name: '王工', phone: '13800010002' },
    ],
  },
  {
    name: '比亚迪股份有限公司',
    contacts: [
      { name: '吴经理', phone: '13800020001' },
    ],
  },
  {
    name: '珠海格力电器',
    contacts: [
      { name: '陈主管', phone: '13800030001' },
    ],
  },
  {
    name: '美的集团',
    contacts: [
      { name: '罗工', phone: '13800040001' },
    ],
  },
  {
    name: '海尔智家',
    contacts: [
      { name: '孙经理', phone: '13800050001' },
    ],
  },
  {
    name: '联想集团',
    contacts: [
      { name: '赵工', phone: '13800060001' },
    ],
  },
  {
    name: '中兴通讯',
    contacts: [
      { name: '钱主管', phone: '13800070001' },
    ],
  },
  {
    name: '京东物流',
    contacts: [
      { name: '冯经理', phone: '13800080001' },
      { name: '李工', phone: '13800080002' },
    ],
  },
];

/**
 * Main seed function.
 * Creates all roles, admin user, staff, customers, and contacts.
 * Uses upsert to be idempotent.
 */
async function main(): Promise<void> {
  console.log('Seeding database...');

  // 1. Create roles
  const roleMap = new Map<string, number>();
  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description,
        permissions: roleData.permissions,
      },
      create: {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
      },
    });
    roleMap.set(roleData.name, role.id);
    console.log(`  Role created/updated: ${roleData.name} (id=${role.id})`);
  }

  // 2. Create admin user
  const adminRoleId = roleMap.get('管理员')!;
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    // 仅在首次创建时设置密码与强制改密；后续重启只确保角色/状态正确，
    // 不再覆盖已有密码，避免管理员改密后每次重启被重置回 admin123。
    update: {
      roleId: adminRoleId,
      status: 'active',
    },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      displayName: '系统管理员',
      roleId: adminRoleId,
      status: 'active',
      mustChangePassword: true,
    },
  });
  console.log(`  Admin user created/updated: admin (id=${admin.id})`);

  // 3. Create after-sales staff (idempotent by name)
  for (const staffData of STAFF_SEED) {
    const existing = await prisma.afterSalesStaff.findFirst({
      where: { name: staffData.name },
    });
    if (!existing) {
      await prisma.afterSalesStaff.create({
        data: {
          name: staffData.name,
          phone: staffData.phone,
          status: 'active',
        },
      });
    }
  }
  console.log('  After-sales staff created (张伟, 李娜, 王强, 刘敏)');

  // 4. Create customers and contacts
  for (const customerData of CUSTOMER_SEED) {
    let customer = await prisma.customer.findUnique({
      where: { name: customerData.name },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerData.name,
          status: 'active',
        },
      });
    }
    console.log(`  Customer created/updated: ${customerData.name} (id=${customer.id})`);

    for (const contactData of customerData.contacts) {
      const existingContact = await prisma.customerContact.findFirst({
        where: {
          customerId: customer.id,
          name: contactData.name,
        },
      });
      if (!existingContact) {
        await prisma.customerContact.create({
          data: {
            customerId: customer.id,
            name: contactData.name,
            phone: contactData.phone,
            status: 'active',
          },
        });
        console.log(`    Contact created: ${contactData.name} (${contactData.phone})`);
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
