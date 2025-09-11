import { prisma } from '../lib/prisma';

async function addDeliverables() {
  console.log('🚀 Adding deliverables to AI Agents of Change Course...');
  
  try {
    // Find the project
    const project = await prisma.project.findFirst({
      where: { title: 'AI Agents of Change Course' }
    });

    if (!project) {
      console.error('❌ Project not found');
      return;
    }

    // Add deliverables for completed modules
    const deliverables = [
      { name: 'Module 1 - Introduction to AI Agents.pdf', status: 'DELIVERED' },
      { name: 'Module 2 - Foundations of Agent Architecture.pdf', status: 'DELIVERED' },
    ];

    for (const deliverable of deliverables) {
      await prisma.deliverable.create({
        data: {
          projectId: project.id,
          title: deliverable.name,
          status: deliverable.status,
          fileUrl: null
        }
      });
      console.log(`✅ Created deliverable: ${deliverable.name}`);
    }

    console.log('\n🎉 Successfully added deliverables');
    
  } catch (error) {
    console.error('❌ Error adding deliverables:', error);
  }
}

addDeliverables()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });