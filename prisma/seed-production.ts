import { prisma } from '../lib/prisma';

async function main() {
  console.log('🌱 Starting production-safe seed...');
  
  // Create users with skipDuplicates
  const users = [
    { name: 'Ian', email: 'ian@gogentic.com' },
    { name: 'Aakansha', email: 'aakansha@gogentic.com' },
    { name: 'Matthew', email: 'matthew@gogentic.com' },
    { name: 'Sarah', email: 'sarah@gogentic.com' },
    { name: 'Mia', email: 'mia@gogentic.com' },
    { name: 'Luke', email: 'luke@gogentic.com' },
  ];
  
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
  
  console.log('✅ Users created/verified');
  
  // Get user IDs for relationships
  const [ian, aakansha, matthew, mia, luke] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'ian@gogentic.com' } }),
    prisma.user.findUnique({ where: { email: 'aakansha@gogentic.com' } }),
    prisma.user.findUnique({ where: { email: 'matthew@gogentic.com' } }),
    prisma.user.findUnique({ where: { email: 'mia@gogentic.com' } }),
    prisma.user.findUnique({ where: { email: 'luke@gogentic.com' } }),
  ]);
  
  if (!ian || !aakansha || !matthew || !mia || !luke) {
    throw new Error('Failed to find required users');
  }
  
  // Create sample projects in batches to avoid connection pool issues
  const projects = [
    {
      title: 'Z School Website Redesign',
      branch: 'CORTEX',
      pmId: aakansha.id,
      clientName: 'Z School',
      clientEmail: 'admin@zschool.com',
      status: 'In Progress',
      startDate: new Date('2024-01-15'),
      targetDelivery: new Date('2024-03-30'),
      notes: 'Complete redesign with new branding',
    },
    {
      title: 'Insider Alpha Trading Platform',
      branch: 'FISHER',
      pmId: ian.id,
      clientName: 'Insider Alpha',
      clientEmail: 'contact@insideralpha.com',
      status: 'In Progress',
      startDate: new Date('2024-02-01'),
      targetDelivery: new Date('2024-05-15'),
      notes: 'Real-time trading dashboard with analytics',
    },
    {
      title: 'Healthcare Analytics Dashboard',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      clientName: 'MedTech Solutions',
      clientEmail: 'info@medtech.com',
      status: 'Review',
      startDate: new Date('2024-01-01'),
      targetDelivery: new Date('2024-02-28'),
      notes: 'Patient data visualization and reporting',
    },
  ];
  
  for (const projectData of projects) {
    const existing = await prisma.project.findFirst({
      where: { 
        title: projectData.title,
        clientEmail: projectData.clientEmail 
      }
    });
    
    if (!existing) {
      const project = await prisma.project.create({
        data: {
          ...projectData,
          developers: {
            connect: projectData.branch === 'FISHER' 
              ? [{ id: mia.id }, { id: luke.id }]
              : []
          }
        }
      });
      
      // Create a few sample tasks for each project
      const taskStatuses = ['Todo', 'Doing', 'Review', 'Done'];
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        projectId: project.id,
        title: `Task ${i + 1} for ${project.title}`,
        status: taskStatuses[i % 4],
        assigneeId: i % 2 === 0 ? mia.id : luke.id,
        order: i,
        estimatedHours: Math.floor(Math.random() * 8) + 2,
        actualHours: Math.floor(Math.random() * 6),
      }));
      
      // Create tasks in smaller batches
      for (let i = 0; i < tasks.length; i += 2) {
        await prisma.task.createMany({
          data: tasks.slice(i, i + 2),
        });
      }
      
      // Add initial activity
      await prisma.update.create({
        data: {
          projectId: project.id,
          authorId: project.pmId,
          body: `Project "${project.title}" created and team assigned`,
        }
      });
      
      console.log(`✅ Project "${project.title}" created with tasks`);
    } else {
      console.log(`⏭️  Project "${projectData.title}" already exists, skipping`);
    }
  }
  
  console.log('🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });