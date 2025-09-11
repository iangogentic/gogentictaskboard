import { prisma } from '../lib/prisma';

async function cleanupAllFakeData() {
  console.log('🧹 Removing ALL fake test data...');
  
  try {
    // Delete fake test projects
    const projectsToDelete = [
      'Healthcare Analytics Dashboard',
      'Insider Alpha Trading Platform',
      'Z School Website Redesign'
    ];
    
    for (const title of projectsToDelete) {
      const project = await prisma.project.findFirst({
        where: { title }
      });
      
      if (project) {
        await prisma.project.delete({
          where: { id: project.id }
        });
        console.log(`✅ Deleted project: ${title}`);
      }
    }
    
    // Delete fake test user (Sarah)
    const sarahUser = await prisma.user.findUnique({
      where: { email: 'sarah@gogentic.com' }
    });
    
    if (sarahUser) {
      // First delete any projects where Sarah is PM
      await prisma.project.deleteMany({
        where: { pmId: sarahUser.id }
      });
      
      // Delete the user
      await prisma.user.delete({
        where: { id: sarahUser.id }
      });
      console.log('✅ Deleted user: Sarah');
    }
    
    // Clean up any orphaned data (skipping task check since projectId is required)
    
    console.log('\n🎉 Cleanup completed!');
    
    // Show remaining data
    const [remainingProjects, remainingUsers] = await Promise.all([
      prisma.project.findMany({
        select: {
          title: true,
          clientName: true,
          status: true
        }
      }),
      prisma.user.findMany({
        select: {
          name: true,
          email: true
        }
      })
    ]);
    
    console.log('\n📊 Remaining data in database:');
    console.log('\n👥 Users:');
    if (remainingUsers.length === 0) {
      console.log('   (No users)');
    } else {
      remainingUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
      });
    }
    
    console.log('\n📁 Projects:');
    if (remainingProjects.length === 0) {
      console.log('   (No projects)');
    } else {
      remainingProjects.forEach(p => {
        console.log(`   - ${p.title} (${p.clientName}) - ${p.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupAllFakeData()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });