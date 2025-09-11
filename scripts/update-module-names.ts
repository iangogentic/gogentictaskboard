import { prisma } from '../lib/prisma';

async function updateModuleNames() {
  console.log('🔄 Updating module task names to be simpler...');
  
  try {
    // Find the project
    const project = await prisma.project.findFirst({
      where: { title: 'AI Agents of Change Course' }
    });

    if (!project) {
      console.error('❌ Project not found');
      return;
    }

    // Get all tasks for this project
    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: { order: 'asc' }
    });

    // Update each task to have simpler names
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const moduleNumber = i + 1;
      
      await prisma.task.update({
        where: { id: task.id },
        data: {
          title: `Module ${moduleNumber}`,
          notes: '' // Clear the notes as well
        }
      });
      
      console.log(`✅ Updated: Module ${moduleNumber}`);
    }

    console.log('\n🎉 Successfully updated all module names to be simpler');
    
  } catch (error) {
    console.error('❌ Error updating module names:', error);
  }
}

updateModuleNames()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });