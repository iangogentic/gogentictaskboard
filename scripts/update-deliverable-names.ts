import { prisma } from '../lib/prisma';

async function updateDeliverableNames() {
  console.log('🔄 Updating deliverable names to be simpler...');
  
  try {
    // Find the project
    const project = await prisma.project.findFirst({
      where: { title: 'AI Agents of Change Course' }
    });

    if (!project) {
      console.error('❌ Project not found');
      return;
    }

    // Get all deliverables for this project
    const deliverables = await prisma.deliverable.findMany({
      where: { projectId: project.id }
    });

    // Update each deliverable to have simpler names
    for (let i = 0; i < deliverables.length; i++) {
      const deliverable = deliverables[i];
      const moduleNumber = i + 1;
      
      await prisma.deliverable.update({
        where: { id: deliverable.id },
        data: {
          title: `Module ${moduleNumber}`
        }
      });
      
      console.log(`✅ Updated deliverable: Module ${moduleNumber}`);
    }

    console.log('\n🎉 Successfully updated all deliverable names to be simpler');
    
  } catch (error) {
    console.error('❌ Error updating deliverable names:', error);
  }
}

updateDeliverableNames()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });