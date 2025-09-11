import { prisma } from '../lib/prisma';

async function main() {
  console.log('Adding test project for client portal...');
  
  // Get a PM user
  const pm = await prisma.user.findFirst({
    where: { email: 'aakansha@gogentic.com' }
  });
  
  if (!pm) {
    console.error('PM user not found');
    return;
  }
  
  // Create a test project for demo client
  const project = await prisma.project.create({
    data: {
      title: 'Demo Client Portal Project',
      branch: 'CORTEX',
      pmId: pm.id,
      clientName: 'Demo Company',
      clientEmail: 'demo@example.com',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-01'),
      targetDelivery: new Date('2024-03-31'),
      notes: 'This is a demo project for testing the client portal',
    }
  });
  
  // Add some tasks
  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        title: 'Setup project environment',
        status: 'Done',
        order: 0,
      },
      {
        projectId: project.id,
        title: 'Design system architecture',
        status: 'Done',
        order: 1,
      },
      {
        projectId: project.id,
        title: 'Implement core features',
        status: 'Doing',
        order: 2,
      },
      {
        projectId: project.id,
        title: 'Testing and QA',
        status: 'Todo',
        order: 3,
      },
      {
        projectId: project.id,
        title: 'Deploy to production',
        status: 'Todo',
        order: 4,
      },
    ]
  });
  
  // Add an update
  await prisma.update.create({
    data: {
      projectId: project.id,
      authorId: pm.id,
      body: 'Project kickoff completed. Team is now working on core feature implementation.',
    }
  });
  
  console.log(`✅ Created project for client: demo@example.com`);
  console.log(`   Share token: ${project.clientShareToken}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });