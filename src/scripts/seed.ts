import { writeJsonFile } from '../utils/fileUtils';
import { hashPassword } from '../utils/authUtils';
import { generateId, generateApiKey } from '../utils/apiKeyUtils';
import { getCurrentTimestamp } from '../utils/dateUtils';
import { 
  User, 
  Retailer, 
  Company, 
  CompanyRetailerLink,
  Transaction, 
  AuditEntry, 
  DisconnectRequest 
} from '../models/types';

async function seed() {
  console.log('🌱 Seeding database (Multi-Retailer Architecture)...\n');
  
  const now = getCurrentTimestamp();
  
  // Create retailers
  console.log('Creating retailers...');
  const retailer1: Retailer = {
    id: generateId(),
    name: 'TechMart Retail',
    apiKey: generateApiKey(),
    webhookUrl: 'https://techmart.example.com/webhooks',
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
  
  const retailer2: Retailer = {
    id: generateId(),
    name: 'OfficePro Supplies',
    apiKey: generateApiKey(),
    webhookUrl: 'https://officepro.example.com/webhooks',
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
  
  const retailer3: Retailer = {
    id: generateId(),
    name: 'ElectroWorld',
    apiKey: generateApiKey(),
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
  
  await writeJsonFile<Retailer>('retailers.json', [retailer1, retailer2, retailer3]);
  console.log(`   Created retailer: ${retailer1.name} (ID: ${retailer1.id})`);
  console.log(`   Created retailer: ${retailer2.name} (ID: ${retailer2.id})`);
  console.log(`   Created retailer: ${retailer3.name} (ID: ${retailer3.id})`);
  
  // Create companies (no longer have retailerId - using link table)
  console.log('\nCreating companies...');
  const company1: Company = {
    id: generateId(),
    name: 'Acme Corporation',
    apiKey: generateApiKey(),
    webhookUrl: 'https://acme.example.com/webhooks',
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
  
  const company2: Company = {
    id: generateId(),
    name: 'GlobalTech Inc',
    apiKey: generateApiKey(),
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
  
  const company3: Company = {
    id: generateId(),
    name: 'StartupXYZ',
    apiKey: generateApiKey(),
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
  
  await writeJsonFile<Company>('companies.json', [company1, company2, company3]);
  console.log(`   Created company: ${company1.name} (ID: ${company1.id})`);
  console.log(`   Created company: ${company2.name} (ID: ${company2.id})`);
  console.log(`   Created company: ${company3.name} (ID: ${company3.id})`);
  
  // Create company-retailer links (MULTI-RETAILER RELATIONSHIPS)
  console.log('\nCreating company-retailer links...');
  const links: CompanyRetailerLink[] = [
    // Acme is linked to TechMart AND OfficePro (multi-retailer!)
    {
      id: generateId(),
      companyId: company1.id,
      retailerId: retailer1.id,
      status: 'active',
      createdAt: now
    },
    {
      id: generateId(),
      companyId: company1.id,
      retailerId: retailer2.id,
      status: 'active',
      createdAt: now
    },
    // GlobalTech is linked to TechMart only
    {
      id: generateId(),
      companyId: company2.id,
      retailerId: retailer1.id,
      status: 'active',
      createdAt: now
    },
    // StartupXYZ is linked to OfficePro AND ElectroWorld
    {
      id: generateId(),
      companyId: company3.id,
      retailerId: retailer2.id,
      status: 'active',
      createdAt: now
    },
    {
      id: generateId(),
      companyId: company3.id,
      retailerId: retailer3.id,
      status: 'active',
      createdAt: now
    }
  ];
  
  await writeJsonFile<CompanyRetailerLink>('company_retailer_links.json', links);
  console.log(`   ${company1.name} ↔ ${retailer1.name}`);
  console.log(`   ${company1.name} ↔ ${retailer2.name}`);
  console.log(`   ${company2.name} ↔ ${retailer1.name}`);
  console.log(`   ${company3.name} ↔ ${retailer2.name}`);
  console.log(`   ${company3.name} ↔ ${retailer3.name}`);
  
  // Create users
  console.log('\nCreating users...');
  
  // System Admin
  const systemAdmin: User = {
    id: generateId(),
    email: 'admin@authenticas.com',
    password: await hashPassword('admin123'),
    firstName: 'System',
    lastName: 'Administrator',
    role: 'system_admin',
    spendingLimit: 0,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Retailer Admin for TechMart
  const retailerAdmin1: User = {
    id: generateId(),
    email: 'admin@techmart.com',
    password: await hashPassword('retailer123'),
    firstName: 'Rachel',
    lastName: 'Manager',
    retailerId: retailer1.id,
    role: 'retailer_admin',
    spendingLimit: 0,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Retailer Admin for OfficePro
  const retailerAdmin2: User = {
    id: generateId(),
    email: 'admin@officepro.com',
    password: await hashPassword('retailer123'),
    firstName: 'Robert',
    lastName: 'Director',
    retailerId: retailer2.id,
    role: 'retailer_admin',
    spendingLimit: 0,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Retailer Admin for ElectroWorld
  const retailerAdmin3: User = {
    id: generateId(),
    email: 'admin@electroworld.com',
    password: await hashPassword('retailer123'),
    firstName: 'Elena',
    lastName: 'Wilson',
    retailerId: retailer3.id,
    role: 'retailer_admin',
    spendingLimit: 0,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Company Admin for Acme
  const companyAdmin1: User = {
    id: generateId(),
    email: 'admin@acme.com',
    password: await hashPassword('company123'),
    firstName: 'Alice',
    lastName: 'CompanyAdmin',
    companyId: company1.id,
    role: 'company_admin',
    spendingLimit: 50000,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Company Admin for GlobalTech
  const companyAdmin2: User = {
    id: generateId(),
    email: 'admin@globaltech.com',
    password: await hashPassword('company123'),
    firstName: 'Gary',
    lastName: 'GlobalAdmin',
    companyId: company2.id,
    role: 'company_admin',
    spendingLimit: 25000,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Company Admin for StartupXYZ
  const companyAdmin3: User = {
    id: generateId(),
    email: 'admin@startupxyz.com',
    password: await hashPassword('company123'),
    firstName: 'Sarah',
    lastName: 'StartupAdmin',
    companyId: company3.id,
    role: 'company_admin',
    spendingLimit: 15000,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Company Users for Acme
  const companyUser1: User = {
    id: generateId(),
    email: 'john@acme.com',
    password: await hashPassword('user123'),
    firstName: 'John',
    lastName: 'Employee',
    companyId: company1.id,
    role: 'company_user',
    spendingLimit: 1000,
    spentThisMonth: 0, // Will be updated based on transactions
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  const companyUser2: User = {
    id: generateId(),
    email: 'jane@acme.com',
    password: await hashPassword('user123'),
    firstName: 'Jane',
    lastName: 'Developer',
    companyId: company1.id,
    role: 'company_user',
    spendingLimit: 2000,
    spentThisMonth: 0, // Will be updated based on transactions
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Company User for GlobalTech
  const companyUser3: User = {
    id: generateId(),
    email: 'mike@globaltech.com',
    password: await hashPassword('user123'),
    firstName: 'Mike',
    lastName: 'Engineer',
    companyId: company2.id,
    role: 'company_user',
    spendingLimit: 1500,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Company User for StartupXYZ
  const companyUser4: User = {
    id: generateId(),
    email: 'lisa@startupxyz.com',
    password: await hashPassword('user123'),
    firstName: 'Lisa',
    lastName: 'Designer',
    companyId: company3.id,
    role: 'company_user',
    spendingLimit: 800,
    spentThisMonth: 0,
    lastResetDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Create sample transactions ACROSS MULTIPLE RETAILERS
  console.log('\nCreating sample transactions (multi-retailer)...');
  const transactions: Transaction[] = [
    // John (Acme) shopping at TechMart
    {
      id: generateId(),
      userId: companyUser1.id,
      companyId: company1.id,
      retailerId: retailer1.id, // TechMart
      amount: 150.00,
      status: 'approved',
      timestamp: now,
      balanceBefore: 0,
      balanceAfter: 150
    },
    // John (Acme) shopping at OfficePro
    {
      id: generateId(),
      userId: companyUser1.id,
      companyId: company1.id,
      retailerId: retailer2.id, // OfficePro
      amount: 100.00,
      status: 'approved',
      timestamp: now,
      balanceBefore: 150,
      balanceAfter: 250
    },
    // Jane (Acme) shopping at TechMart
    {
      id: generateId(),
      userId: companyUser2.id,
      companyId: company1.id,
      retailerId: retailer1.id, // TechMart
      amount: 500.00,
      status: 'approved',
      timestamp: now,
      balanceBefore: 0,
      balanceAfter: 500
    },
    // Jane (Acme) shopping at OfficePro
    {
      id: generateId(),
      userId: companyUser2.id,
      companyId: company1.id,
      retailerId: retailer2.id, // OfficePro
      amount: 300.00,
      status: 'approved',
      timestamp: now,
      balanceBefore: 500,
      balanceAfter: 800
    },
    // Mike (GlobalTech) shopping at TechMart
    {
      id: generateId(),
      userId: companyUser3.id,
      companyId: company2.id,
      retailerId: retailer1.id, // TechMart
      amount: 200.00,
      status: 'approved',
      timestamp: now,
      balanceBefore: 0,
      balanceAfter: 200
    },
    // Lisa (StartupXYZ) shopping at OfficePro
    {
      id: generateId(),
      userId: companyUser4.id,
      companyId: company3.id,
      retailerId: retailer2.id, // OfficePro
      amount: 75.00,
      status: 'approved',
      timestamp: now,
      balanceBefore: 0,
      balanceAfter: 75
    },
    // Lisa (StartupXYZ) shopping at ElectroWorld
    {
      id: generateId(),
      userId: companyUser4.id,
      companyId: company3.id,
      retailerId: retailer3.id, // ElectroWorld
      amount: 125.00,
      status: 'approved',
      timestamp: now,
      balanceBefore: 75,
      balanceAfter: 200
    }
  ];
  
  // Update user spending based on GLOBAL totals (across all retailers)
  companyUser1.spentThisMonth = 250; // 150 + 100
  companyUser2.spentThisMonth = 800; // 500 + 300
  companyUser3.spentThisMonth = 200;
  companyUser4.spentThisMonth = 200; // 75 + 125
  
  const users = [
    systemAdmin, 
    retailerAdmin1, 
    retailerAdmin2, 
    retailerAdmin3,
    companyAdmin1, 
    companyAdmin2, 
    companyAdmin3,
    companyUser1, 
    companyUser2,
    companyUser3,
    companyUser4
  ];
  
  await writeJsonFile<User>('users.json', users);
  await writeJsonFile<Transaction>('transactions.json', transactions);
  
  console.log('   --- System Admin ---');
  console.log(`   Email: ${systemAdmin.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Role: ${systemAdmin.role}`);
  
  console.log('\n   --- Retailer Admins ---');
  console.log(`   Email: ${retailerAdmin1.email} | Password: retailer123 | Retailer: ${retailer1.name}`);
  console.log(`   Email: ${retailerAdmin2.email} | Password: retailer123 | Retailer: ${retailer2.name}`);
  console.log(`   Email: ${retailerAdmin3.email} | Password: retailer123 | Retailer: ${retailer3.name}`);
  
  console.log('\n   --- Company Admins ---');
  console.log(`   Email: ${companyAdmin1.email} | Password: company123 | Company: ${company1.name}`);
  console.log(`   Email: ${companyAdmin2.email} | Password: company123 | Company: ${company2.name}`);
  console.log(`   Email: ${companyAdmin3.email} | Password: company123 | Company: ${company3.name}`);
  
  console.log('\n   --- Company Users ---');
  console.log(`   Email: ${companyUser1.email} | Password: user123 | Company: ${company1.name} | Spent: $${companyUser1.spentThisMonth}`);
  console.log(`   Email: ${companyUser2.email} | Password: user123 | Company: ${company1.name} | Spent: $${companyUser2.spentThisMonth}`);
  console.log(`   Email: ${companyUser3.email} | Password: user123 | Company: ${company2.name} | Spent: $${companyUser3.spentThisMonth}`);
  console.log(`   Email: ${companyUser4.email} | Password: user123 | Company: ${company3.name} | Spent: $${companyUser4.spentThisMonth}`);
  
  console.log(`\n   Created ${transactions.length} sample transactions across multiple retailers`);
  
  // Initialize empty disconnect requests
  await writeJsonFile<DisconnectRequest>('disconnect_requests.json', []);
  
  // Initialize empty audit log
  await writeJsonFile<AuditEntry>('audit.json', []);
  console.log('   Initialized audit log');
  
  console.log('\n✅ Seeding complete!\n');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  MULTI-RETAILER ARCHITECTURE');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  Company-Retailer Links:');
  console.log('    • Acme Corporation    ↔ TechMart, OfficePro');
  console.log('    • GlobalTech Inc      ↔ TechMart');
  console.log('    • StartupXYZ          ↔ OfficePro, ElectroWorld');
  console.log('');
  console.log('  Spending limits are GLOBAL (across all retailers)');
  console.log('  Retailer dashboards show ONLY their transactions');
  console.log('  Company dashboards show aggregated totals');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  Test Credentials:');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  SYSTEM ADMIN:');
  console.log('    admin@authenticas.com / admin123');
  console.log('');
  console.log('  RETAILER ADMINS:');
  console.log('    admin@techmart.com / retailer123');
  console.log('    admin@officepro.com / retailer123');
  console.log('    admin@electroworld.com / retailer123');
  console.log('');
  console.log('  COMPANY ADMINS:');
  console.log('    admin@acme.com / company123');
  console.log('    admin@globaltech.com / company123');
  console.log('    admin@startupxyz.com / company123');
  console.log('');
  console.log('  COMPANY USERS:');
  console.log('    john@acme.com / user123');
  console.log('    jane@acme.com / user123');
  console.log('    mike@globaltech.com / user123');
  console.log('    lisa@startupxyz.com / user123');
  console.log('════════════════════════════════════════════════════════════════════');
}

seed().catch(console.error);
