/**
 * Create Admin User Script
 * Run: node prisma/createAdmin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    const adminEmail = 'admin@bookmygame.com';
    const adminPassword = 'Admin@123'; // Change this!

    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email:', adminEmail);
            console.log('Role:', existingAdmin.role);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                fullName: 'System Admin',
                role: 'admin',
                isVerified: true,
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email:', admin.email);
        console.log('Password:', adminPassword);
        console.log('Role:', admin.role);
        console.log('\n⚠️  Please change the password after first login!');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
