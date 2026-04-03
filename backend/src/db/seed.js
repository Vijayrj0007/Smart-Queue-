/**
 * Database Seed Script — SQLite version
 * Populates database with sample data for development/demo
 * Includes 3-actor system: Admin, Provider (Organization), User
 */
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/smartqueue.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

async function seed() {
  try {
    console.log('🌱 Seeding database...\n');

    // Clear existing data (in reverse order of dependencies)
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM tokens');
    db.exec('DELETE FROM queues');
    db.exec('DELETE FROM locations');
    db.exec("DELETE FROM users WHERE email != ''");
    db.exec("DELETE FROM organizations WHERE email != 'default@smartqueue.local'");
    console.log('  🗑️  Cleared existing data');

    // ---- USERS ----
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const userTransaction = db.transaction(() => {
      insertUser.run('Admin User', 'admin@smartqueue.com', hashedPassword, '+91 98765 43210', 'admin');
      insertUser.run('Dr. Sarah Wilson', 'sarah@hospital.com', hashedPassword, '+91 98765 43211', 'admin');
      insertUser.run('John Doe', 'john@example.com', hashedPassword, '+91 98765 43212', 'user');
      insertUser.run('Jane Smith', 'jane@example.com', hashedPassword, '+91 98765 43213', 'user');
      insertUser.run('Mike Johnson', 'mike@example.com', hashedPassword, '+91 98765 43214', 'user');
      insertUser.run('Emily Davis', 'emily@example.com', hashedPassword, '+91 98765 43215', 'user');
      insertUser.run('Robert Brown', 'robert@example.com', hashedPassword, '+91 98765 43216', 'user');
      insertUser.run('Lisa Anderson', 'lisa@example.com', hashedPassword, '+91 98765 43217', 'user');
    });
    userTransaction();
    
    const users = db.prepare('SELECT id, name, email, role FROM users').all();
    console.log(`  👥 Created ${users.length} users`);

    // ---- ORGANIZATIONS (Providers) ----
    const insertOrg = db.prepare(`
      INSERT OR IGNORE INTO organizations (name, email, password_hash, type)
      VALUES (?, ?, ?, ?)
    `);

    const orgTransaction = db.transaction(() => {
      insertOrg.run('City Hospital Group', 'hospital@provider.com', hashedPassword, 'hospital');
      insertOrg.run('HealthFirst Network', 'healthfirst@provider.com', hashedPassword, 'clinic');
      insertOrg.run('GovServ Solutions', 'govserv@provider.com', hashedPassword, 'government');
    });
    orgTransaction();

    const orgs = db.prepare("SELECT id, name, email FROM organizations WHERE email != 'default@smartqueue.local'").all();
    console.log(`  🏢 Created ${orgs.length} provider organizations`);

    // ---- LOCATIONS ----
    const insertLocation = db.prepare(`
      INSERT INTO locations (name, type, description, address, city, state, phone, email, admin_id, operating_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const locationTransaction = db.transaction(() => {
      insertLocation.run(
        'City General Hospital', 'hospital',
        'A premier multi-specialty hospital offering comprehensive healthcare services with state-of-the-art facilities and experienced medical professionals.',
        '123 Medical Drive, HSR Layout', 'Bangalore', 'Karnataka',
        '+91 80 2345 6789', 'info@cityhospital.com', 1,
        '{"open": "08:00", "close": "20:00", "days": ["Mon","Tue","Wed","Thu","Fri","Sat"]}'
      );
      insertLocation.run(
        'HealthFirst Clinic', 'clinic',
        'Your neighborhood clinic providing primary healthcare, diagnostics, and preventive care with a personal touch.',
        '456 Wellness Street, Koramangala', 'Bangalore', 'Karnataka',
        '+91 80 3456 7890', 'care@healthfirst.com', 2,
        '{"open": "09:00", "close": "18:00", "days": ["Mon","Tue","Wed","Thu","Fri","Sat"]}'
      );
      insertLocation.run(
        'Government Services Center', 'government',
        'One-stop center for all government document services including passport, driving license, and certificate processing.',
        '789 Civic Center Road, MG Road', 'Bangalore', 'Karnataka',
        '+91 80 4567 8901', 'services@govoffice.com', 1,
        '{"open": "10:00", "close": "16:00", "days": ["Mon","Tue","Wed","Thu","Fri"]}'
      );
      insertLocation.run(
        'National Bank Branch', 'bank',
        'Full-service banking branch offering personal banking, loans, investments, and business banking solutions.',
        '321 Finance Avenue, Indiranagar', 'Bangalore', 'Karnataka',
        '+91 80 5678 9012', 'support@nationalbank.com', 1,
        '{"open": "09:30", "close": "15:30", "days": ["Mon","Tue","Wed","Thu","Fri"]}'
      );
      insertLocation.run(
        'Sunrise Medical Center', 'hospital',
        'Advanced medical center specializing in cardiology, orthopedics, and neurology with 24/7 emergency services.',
        '555 Healthcare Blvd, Whitefield', 'Bangalore', 'Karnataka',
        '+91 80 6789 0123', 'info@sunrisemedical.com', 2,
        '{"open": "00:00", "close": "23:59", "days": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}'
      );
    });
    locationTransaction();

    const locations = db.prepare('SELECT id, name FROM locations').all();
    console.log(`  🏥 Created ${locations.length} locations`);

    // ---- QUEUES ----
    // Mix of statuses to demonstrate governance:
    //   active   — approved by admin, visible to users
    //   pending  — created by provider, awaiting admin approval
    //   inactive — deactivated by admin
    const insertQueue = db.prepare(`
      INSERT INTO queues (location_id, organization_id, name, description, prefix, current_number, now_serving, avg_service_time, status, max_capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Find org IDs (default=1 is the Default Organization from migration)
    const hospitalOrg = orgs.find(o => o.email === 'hospital@provider.com');
    const healthOrg = orgs.find(o => o.email === 'healthfirst@provider.com');
    const govOrg = orgs.find(o => o.email === 'govserv@provider.com');
    const hospitalOrgId = hospitalOrg?.id || 1;
    const healthOrgId = healthOrg?.id || 1;
    const govOrgId = govOrg?.id || 1;

    const queueTransaction = db.transaction(() => {
      // Active queues (approved by admin)
      insertQueue.run(1, hospitalOrgId, 'General OPD', 'General outpatient department for consultations', 'G', 15, 8, 10, 'active', 100);
      insertQueue.run(1, hospitalOrgId, 'Emergency', 'Emergency department - priority cases', 'E', 5, 3, 15, 'active', 50);
      insertQueue.run(1, hospitalOrgId, 'Pharmacy', 'Medicine dispensary counter', 'P', 20, 16, 3, 'active', 200);
      insertQueue.run(1, hospitalOrgId, 'Lab Tests', 'Blood tests and diagnostics', 'L', 12, 9, 8, 'active', 80);
      insertQueue.run(2, healthOrgId, 'General Consultation', 'Walk-in doctor consultations', 'C', 8, 5, 12, 'active', 50);
      insertQueue.run(2, healthOrgId, 'Dental Care', 'Dental checkup and procedures', 'D', 6, 4, 20, 'active', 30);
      insertQueue.run(3, govOrgId, 'Document Verification', 'Document submission and verification', 'V', 25, 18, 7, 'active', 150);
      insertQueue.run(3, govOrgId, 'Certificate Collection', 'Collect processed certificates', 'R', 10, 7, 5, 'active', 100);
      insertQueue.run(4, 1, 'Account Services', 'Account opening, closing, and modifications', 'A', 8, 5, 15, 'active', 40);
      insertQueue.run(4, 1, 'Loan Department', 'Loan applications and inquiries', 'LN', 5, 3, 20, 'active', 30);

      // Pending queues (awaiting admin approval — demonstrates governance)
      insertQueue.run(5, hospitalOrgId, 'Cardiology OPD', 'Heart specialist consultations', 'H', 0, 0, 15, 'pending', 40);
      insertQueue.run(5, healthOrgId, 'Orthopedics OPD', 'Bone and joint specialist', 'O', 0, 0, 12, 'pending', 40);

      // Inactive queue (deactivated by admin)
      insertQueue.run(2, healthOrgId, 'Skin Care', 'Dermatology appointments', 'SK', 0, 0, 15, 'inactive', 25);
    });
    queueTransaction();

    const queues = db.prepare('SELECT id, name, location_id, status FROM queues').all();
    console.log(`  📋 Created ${queues.length} queues (${queues.filter(q=>q.status==='active').length} active, ${queues.filter(q=>q.status==='pending').length} pending, ${queues.filter(q=>q.status==='inactive').length} inactive)`);

    // ---- TOKENS ----
    const insertToken = db.prepare(`
      INSERT INTO tokens (token_number, queue_id, user_id, status, position, is_priority, booked_at, called_at, completed_at, estimated_wait)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTokenSimple = db.prepare(`
      INSERT INTO tokens (token_number, queue_id, user_id, status, position, booked_at, estimated_wait)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let tokenCount = 0;

    const tokenTransaction = db.transaction(() => {
      // Create tokens for first queue (General OPD)
      for (let i = 1; i <= 15; i++) {
        const status = i <= 7 ? 'completed' : (i === 8 ? 'serving' : 'waiting');
        const userId = ((i - 1) % 6) + 3; // Users 3-8
        const bookedAt = new Date(Date.now() - (16 - i) * 12 * 60000).toISOString();
        const calledAt = status !== 'waiting' ? new Date(Date.now() - (15 - i) * 10 * 60000).toISOString() : null;
        const completedAt = status === 'completed' ? new Date(Date.now() - (15 - i) * 10 * 60000 + 8 * 60000).toISOString() : null;

        insertToken.run(
          `G${String(i).padStart(3, '0')}`,
          1, userId, status, i,
          i === 2 ? 1 : 0, // Token #2 is priority
          bookedAt, calledAt, completedAt,
          status === 'waiting' ? (i - 8) * 10 : 0
        );
        tokenCount++;
      }

      // Create tokens for other active queues
      const activeQueues = queues.filter(q => q.status === 'active');
      for (const queue of activeQueues.slice(1, 6)) {
        for (let i = 1; i <= 5; i++) {
          const status = i <= 2 ? 'completed' : (i === 3 ? 'serving' : 'waiting');
          const userId = ((i - 1) % 6) + 3;
          const bookedAt = new Date(Date.now() - (6 - i) * 15 * 60000).toISOString();

          insertTokenSimple.run(
            `${queue.name.charAt(0)}${String(i).padStart(3, '0')}`,
            queue.id, userId, status, i,
            bookedAt,
            status === 'waiting' ? (i - 3) * 8 : 0
          );
          tokenCount++;
        }
      }
    });
    tokenTransaction();

    console.log(`  🎫 Created ${tokenCount} tokens`);

    // ---- NOTIFICATIONS ----
    const insertNotification = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)
    `);

    const notifTransaction = db.transaction(() => {
      insertNotification.run(3, 'Token Booked', 'Your token G009 has been booked for General OPD at City General Hospital.', 'success', 1);
      insertNotification.run(3, 'Queue Update', 'You are now at position 2 in the General OPD queue. Estimated wait: 20 minutes.', 'queue_update', 1);
      insertNotification.run(3, 'Turn Approaching', 'Your turn is approaching! You are next in line at General OPD.', 'turn_approaching', 0);
      insertNotification.run(4, 'Token Booked', 'Your token G010 has been booked for General OPD at City General Hospital.', 'success', 1);
      insertNotification.run(5, 'Token Booked', 'Your token C004 has been booked for General Consultation at HealthFirst Clinic.', 'success', 0);
    });
    notifTransaction();

    console.log('  🔔 Created sample notifications');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📌 Demo Credentials:');
    console.log('  Admin:    admin@smartqueue.com / password123');
    console.log('  User:     john@example.com / password123');
    console.log('  Provider: hospital@provider.com / password123');
    console.log('  Provider: healthfirst@provider.com / password123');
    console.log('  Provider: govserv@provider.com / password123');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    db.close();
  }
}

seed();
