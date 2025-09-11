import { prisma } from '../lib/prisma';

async function cleanupFakeData() {
  console.log('🧹 Removing fake test projects...');
  
  try {
    // Delete the fake projects by title
    const projectsToDelete = [
      'Healthcare Analytics Dashboard',
      'Insider Alpha Trading Platform'
    ];
    
    for (const title of projectsToDelete) {
      const project = await prisma.project.findFirst({
        where: { title }
      });
      
      if (project) {
        // Delete project (cascades to tasks, updates, etc.)
        await prisma.project.delete({
          where: { id: project.id }
        });
        console.log(`✅ Deleted project: ${title}`);
      } else {
        console.log(`⏭️  Project not found: ${title}`);
      }
    }
    
    console.log('🎉 Cleanup completed!');
    
    // Show remaining projects
    const remainingProjects = await prisma.project.findMany({
      select: {
        title: true,
        clientName: true,
        status: true
      }
    });
    
    console.log('\n📊 Remaining projects:');
    if (remainingProjects.length === 0) {
      console.log('   (No projects in database)');
    } else {
      remainingProjects.forEach(p => {
        console.log(`   - ${p.title} (${p.clientName}) - ${p.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupFakeData()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });