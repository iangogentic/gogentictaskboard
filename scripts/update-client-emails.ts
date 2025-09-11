import { prisma } from '../lib/prisma';

async function main() {
  console.log('Updating client emails for Z School projects...');
  
  // Update all projects that are NOT Fisher branch to egreenberg@zschool.com
  const result = await prisma.project.updateMany({
    where: {
      branch: {
        not: 'FISHER'
      }
    },
    data: {
      clientEmail: 'egreenberg@zschool.com',
      clientName: 'Eric Greenberg - Z School'
    }
  });
  
  console.log(`✅ Updated ${result.count} projects to egreenberg@zschool.com`);
  
  // Let's also check what projects we have
  const allProjects = await prisma.project.findMany({
    select: {
      title: true,
      branch: true,
      clientEmail: true,
      clientName: true,
      status: true
    }
  });
  
  console.log('\n📋 Current projects in database:');
  allProjects.forEach(p => {
    console.log(`  - ${p.title} (${p.branch}) -> ${p.clientEmail}`);
  });
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