import { prisma } from '../lib/prisma';

async function checkDatabase() {
  console.log('📊 Database Status Report\n');
  console.log('=' .repeat(50));
  
  try {
    // Count all entities
    const [
      userCount,
      projectCount,
      taskCount,
      updateCount,
      timeEntryCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.update.count(),
      prisma.timeEntry.count()
    ]);
    
    console.log('\n📈 Summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Tasks: ${taskCount}`);
    console.log(`   Updates: ${updateCount}`);
    console.log(`   Time Entries: ${timeEntryCount}`);
    
    // List users
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log('\n👥 Users:');
    if (users.length === 0) {
      console.log('   (No users)');
    } else {
      users.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
      });
    }
    
    // List projects
    const projects = await prisma.project.findMany({
      select: {
        title: true,
        clientName: true,
        status: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📁 Projects:');
    if (projects.length === 0) {
      console.log('   (No projects - database is clean!)');
    } else {
      projects.forEach(p => {
        console.log(`   - ${p.title}`);
        console.log(`     Client: ${p.clientName}`);
        console.log(`     Branch: ${p.branch} | Status: ${p.status}`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabase()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });