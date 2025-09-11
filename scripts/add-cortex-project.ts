import { prisma } from '../lib/prisma';

async function addCortexProject() {
  console.log('🚀 Adding CORTEX project: AI Agents of Change Course...');
  
  try {
    // Get Aakansha as PM
    const aakansha = await prisma.user.findUnique({
      where: { email: 'aakansha@gogentic.com' }
    });

    if (!aakansha) {
      console.error('❌ Aakansha not found in database');
      return;
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        title: 'AI Agents of Change Course',
        branch: 'CORTEX',
        pmId: aakansha.id,
        developers: {
          connect: [{ id: aakansha.id }]
        },
        clientName: 'Internal Training',
        clientEmail: 'training@gogentic.com',
        status: 'IN_PROGRESS',
        startDate: new Date('2025-01-06'),
        targetDelivery: new Date('2025-01-31'),
        notes: 'AI course development - 8 modules total. Modules 1-2 delivered, currently working on modules 6-8.'
      }
    });

    console.log('✅ Project created:', project.title);

    // Create tasks for the modules
    const modules = [
      { num: 1, status: 'DONE', title: 'Module 1: Introduction to AI Agents' },
      { num: 2, status: 'DONE', title: 'Module 2: Foundations of Agent Architecture' },
      { num: 3, status: 'TODO', title: 'Module 3: Agent Communication Protocols' },
      { num: 4, status: 'TODO', title: 'Module 4: Multi-Agent Systems' },
      { num: 5, status: 'TODO', title: 'Module 5: Agent Learning & Adaptation' },
      { num: 6, status: 'DOING', title: 'Module 6: Real-World Applications' },
      { num: 7, status: 'DOING', title: 'Module 7: Ethics & Safety in AI Agents' },
      { num: 8, status: 'DOING', title: 'Module 8: Future of Autonomous Agents' },
    ];

    for (const module of modules) {
      await prisma.task.create({
        data: {
          title: module.title,
          status: module.status === 'DONE' ? 'Done' : module.status === 'DOING' ? 'Doing' : 'Todo',
          projectId: project.id,
          assigneeId: aakansha.id,
          dueDate: module.status === 'DONE' 
            ? new Date('2025-01-08') 
            : module.status === 'DOING'
            ? new Date('2025-01-15')
            : new Date('2025-01-22'),
          order: module.num,
          notes: `Course content for ${module.title}`,
          estimatedHours: 40,
          actualHours: module.status === 'DONE' ? 40 : module.status === 'DOING' ? 20 : 0
        }
      });
      console.log(`✅ Created task: ${module.title} (${module.status})`);
    }

    // Add initial project update
    await prisma.update.create({
      data: {
        projectId: project.id,
        authorId: aakansha.id,
        body: 'Modules 1 and 2 have been sent over to the client. Currently finishing up modules 6 through 8. The course is progressing well with positive feedback on the initial modules.',
      }
    });

    console.log('✅ Added project update');

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

    console.log('\n🎉 Successfully added CORTEX project: AI Agents of Change Course');
    console.log(`   PM: ${aakansha.name}`);
    console.log('   Status: IN_PROGRESS');
    console.log('   Modules 1-2: ✅ Delivered');
    console.log('   Modules 6-8: 🔄 In Progress');
    console.log('   Modules 3-5: ⏳ Pending');
    
  } catch (error) {
    console.error('❌ Error adding project:', error);
  }
}

addCortexProject()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });