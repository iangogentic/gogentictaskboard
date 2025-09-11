import { prisma } from '../lib/prisma';

async function cleanupSarah() {
  console.log('🧹 Removing Sarah user...');
  
  try {
    // Find Sarah
    const sarahUser = await prisma.user.findUnique({
      where: { email: 'sarah@gogentic.com' }
    });
    
    if (sarahUser) {
      // Check if Sarah is a PM on any projects
      const projectsAsPM = await prisma.project.findMany({
        where: { pmId: sarahUser.id }
      });
      
      if (projectsAsPM.length > 0) {
        console.log(`⚠️  Sarah is PM on ${projectsAsPM.length} project(s). These need to be reassigned first.`);
        // For now, we'll just note this - in production you'd reassign to another user
      }
      
      // Check if Sarah has any tasks
      const tasks = await prisma.task.findMany({
        where: { assigneeId: sarahUser.id }
      });
      
      if (tasks.length > 0) {
        // Unassign Sarah from tasks
        await prisma.task.updateMany({
          where: { assigneeId: sarahUser.id },
          data: { assigneeId: null }
        });
        console.log(`✅ Unassigned Sarah from ${tasks.length} task(s)`);
      }
      
      // Check if Sarah has any updates
      const updates = await prisma.update.findMany({
        where: { authorId: sarahUser.id }
      });
      
      if (updates.length > 0) {
        // Delete Sarah's updates
        await prisma.update.deleteMany({
          where: { authorId: sarahUser.id }
        });
        console.log(`✅ Deleted ${updates.length} update(s) by Sarah`);
      }
      
      // Check if Sarah has any time entries
      const timeEntries = await prisma.timeEntry.findMany({
        where: { userId: sarahUser.id }
      });
      
      if (timeEntries.length > 0) {
        // Delete Sarah's time entries
        await prisma.timeEntry.deleteMany({
          where: { userId: sarahUser.id }
        });
        console.log(`✅ Deleted ${timeEntries.length} time entry(ies) by Sarah`);
      }
      
      // Now safe to delete Sarah
      await prisma.user.delete({
        where: { id: sarahUser.id }
      });
      console.log('✅ Deleted user: Sarah');
    } else {
      console.log('⏭️  Sarah not found in database');
    }
    
    console.log('\n🎉 Cleanup completed!');
    
    // Show remaining users
    const remainingUsers = await prisma.user.findMany({
      select: {
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log('\n👥 Remaining users:');
    if (remainingUsers.length === 0) {
      console.log('   (No users)');
    } else {
      remainingUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupSarah()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });