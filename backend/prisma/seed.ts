import { PrismaClient, Role, StudentStatus, EquipmentCategory, EquipmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos iniciales (Seed)...');

  // 1. Limpieza segura
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.penalty.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hashes de contraseñas
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const studentPassword = await bcrypt.hash('Password123!', 10);

  // 3. Crear Administrador
  const admin = await prisma.user.create({
    data: {
      studentCode: 'ADMIN-001',
      email: 'admin@universidad.edu.pe',
      fullName: 'Ing. Carlos Mendoza (Encargado de Lab)',
      role: Role.ADMIN,
      studentStatus: StudentStatus.ACTIVE,
      passwordHash: adminPassword,
    },
  });

  // 4. Crear Estudiantes de prueba (cumpliendo N0 + 8 dígitos)
  const student1 = await prisma.user.create({
    data: {
      studentCode: 'N001234567',
      email: 'juan.perez@universidad.edu.pe',
      fullName: 'Juan Pérez Rodríguez',
      career: 'Ingeniería de Sistemas Computacionales',
      role: Role.STUDENT,
      studentStatus: StudentStatus.ACTIVE,
      passwordHash: studentPassword,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      studentCode: 'N009876543',
      email: 'maria.garcia@universidad.edu.pe',
      fullName: 'María García López',
      career: 'Ingeniería Electrónica',
      role: Role.STUDENT,
      studentStatus: StudentStatus.ACTIVE,
      passwordHash: studentPassword,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      studentCode: 'N001122334',
      email: 'luis.torres@universidad.edu.pe',
      fullName: 'Luis Torres Valdivia',
      career: 'Ingeniería de Redes y Comunicaciones',
      role: Role.STUDENT,
      studentStatus: StudentStatus.PENALIZED,
      passwordHash: studentPassword,
    },
  });

  console.log(`✅ Usuarios creados: 1 Admin, 3 Estudiantes.`);

  // 5. Crear Equipos de Laboratorio
  const equipmentsData = [
    // CÓMPUTO
    {
      inventoryCode: 'LAB-COMP-001',
      name: 'Laptop Dell Precision 3581',
      category: EquipmentCategory.COMPUTO,
      brand: 'Dell',
      model: 'Precision 3581 Mobile Workstation',
      serialNumber: 'SN-DELL-3581-01',
      location: 'Mesa Cómputo 01',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60',
      specifications: 'Intel Core i7-13700H, 32GB RAM DDR5, 1TB SSD NVMe, NVIDIA RTX A1000 6GB.',
    },
    {
      inventoryCode: 'LAB-COMP-002',
      name: 'Workstation HP Z2 Tower G9',
      category: EquipmentCategory.COMPUTO,
      brand: 'HP',
      model: 'Z2 G9 Tower',
      serialNumber: 'SN-HP-Z2-02',
      location: 'Mesa Cómputo 02',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&auto=format&fit=crop&q=60',
      specifications: 'Intel Core i9-13900K, 64GB RAM DDR5, 2TB SSD + 4TB HDD, NVIDIA RTX 4080 16GB.',
    },
    {
      inventoryCode: 'LAB-COMP-003',
      name: 'MacBook Pro 16 M3 Max',
      category: EquipmentCategory.COMPUTO,
      brand: 'Apple',
      model: 'MacBook Pro 16-inch 2023',
      serialNumber: 'SN-APL-M3M-03',
      location: 'Mesa Cómputo 03',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=60',
      specifications: 'Apple M3 Max (14-core CPU, 30-core GPU), 36GB Memoria Unificada, 1TB SSD.',
    },
    // ELECTRÓNICA
    {
      inventoryCode: 'LAB-ELEC-001',
      name: 'Osciloscopio Digital Tektronix TBS1102B',
      category: EquipmentCategory.ELECTRONICA,
      brand: 'Tektronix',
      model: 'TBS1102B-EDU',
      serialNumber: 'SN-TEK-1102-01',
      location: 'Estantería Electrónica E-01',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60',
      specifications: '100 MHz de ancho de banda, 2 canales analógicos, 2 GS/s frecuencia de muestreo.',
    },
    {
      inventoryCode: 'LAB-ELEC-002',
      name: 'Generador de Funciones Arbitrarias Rigol',
      category: EquipmentCategory.ELECTRONICA,
      brand: 'Rigol',
      model: 'DG1022Z',
      serialNumber: 'SN-RGL-1022-02',
      location: 'Estantería Electrónica E-02',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60',
      specifications: '25 MHz frecuencia máxima, 2 canales independientes, tecnología SiFi.',
    },
    {
      inventoryCode: 'LAB-ELEC-003',
      name: 'Fuente de Alimentación Triple Keysight',
      category: EquipmentCategory.ELECTRONICA,
      brand: 'Keysight',
      model: 'E3631A',
      serialNumber: 'SN-KEY-3631-03',
      location: 'Estantería Electrónica E-03',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop&q=60',
      specifications: 'Salida triple 80W, 0-6V/5A, 0 a +25V/1A, 0 a -25V/1A con bajo rizado y ruido.',
    },
    // REDES
    {
      inventoryCode: 'LAB-RED-001',
      name: 'Switch Administrable Cisco Catalyst 9200L',
      category: EquipmentCategory.REDES,
      brand: 'Cisco',
      model: 'C9200L-24P-4G',
      serialNumber: 'SN-CSC-9200-01',
      location: 'Rack Principal R-01',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=60',
      specifications: '24 puertos PoE+ 10/100/1000 Mbps, 4 enlaces Gigabit SFP, soporte Cisco DNA.',
    },
    {
      inventoryCode: 'LAB-RED-002',
      name: 'Router de Servicios Integrados Cisco ISR 4331',
      category: EquipmentCategory.REDES,
      brand: 'Cisco',
      model: 'ISR4331/K9',
      serialNumber: 'SN-CSC-4331-02',
      location: 'Rack Principal R-02',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60',
      specifications: '100 Mbps throughput ampliable a 300 Mbps, 3 puertos GE/SFP, 2 ranuras NIM.',
    },
    {
      inventoryCode: 'LAB-RED-003',
      name: 'Punto de Acceso Wi-Fi 6 Ubiquiti UniFi U6-Pro',
      category: EquipmentCategory.REDES,
      brand: 'Ubiquiti',
      model: 'U6-Pro',
      serialNumber: 'SN-UBI-U6P-03',
      location: 'Módulo Inalámbrico W-01',
      status: EquipmentStatus.DISPONIBLE,
      imageUrl: 'https://images.unsplash.com/photo-1544197150-199123fa6d70?w=600&auto=format&fit=crop&q=60',
      specifications: 'Wi-Fi 6 de alto rendimiento, tasa de datos agregada 5.3 Gbps, PoE+, MIMO 4x4.',
    },
  ];

  for (const eq of equipmentsData) {
    await prisma.equipment.create({ data: eq });
  }
  console.log(`✅ Equipos creados: ${equipmentsData.length} equipos en Cómputo, Electrónica y Redes.`);

  // 6. Notificaciones iniciales de bienvenida
  await prisma.notification.create({
    data: {
      userId: student1.id,
      title: '¡Bienvenido al Sistema de Laboratorios!',
      message: 'Recuerda que puedes solicitar la reserva de equipos según el horario de tu práctica.',
    },
  });

  console.log('🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
