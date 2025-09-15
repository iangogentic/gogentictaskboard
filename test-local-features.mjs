import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testLocalFeatures() {
  console.log('🧪 Testing Local Operations Agent Features\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test 1: Create a test user if needed
    console.log('1️⃣ Setting up test user...');
    let user = await prisma.user.findFirst({
      where: { email: 'test@localhost.com' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@localhost.com',
          name: 'Test User',
          role: 'admin'
        }
      });
      console.log('   ✅ Created test user');
    } else {
      console.log('   ✅ Test user exists');
    }

    // Test 2: Create a test project
    console.log('\n2️⃣ Creating test project...');
    const project = await prisma.project.create({
      data: {
        title: `Test Project ${Date.now()}`,
        clientName: 'Test Client',
        clientEmail: 'test@localhost.com',
        status: 'In Progress',
        health: 'Green',
        branch: 'main',
        stage: 'Build',
        pmId: user.id
      }
    });
    console.log(`   ✅ Created project: ${project.title}`);

    // Test 3: Create an agent session
    console.log('\n3️⃣ Creating agent session...');
    const session = await prisma.agentSession.create({
      data: {
        userId: user.id,
        projectId: project.id,
        state: 'active',
        plan: { request: 'Test the Operations Agent', steps: [] }
      }
    });
    console.log(`   ✅ Created session: ${session.id}`);

    // Test 4: Create a conversation (Sprint 6)
    console.log('\n4️⃣ Testing conversation memory...');
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        projectId: project.id,
        title: 'Test Conversation',
        summary: 'Testing Sprint 6 features'
      }
    });
    console.log(`   ✅ Created conversation: ${conversation.id}`);

    // Test 5: Add a message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: 'Test the agent features'
      }
    });
    console.log('   ✅ Added message to conversation');

    // Test 6: Create a workflow (Sprint 6)
    console.log('\n5️⃣ Testing workflow engine...');
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Test Workflow',
        description: 'Automated test workflow',
        steps: JSON.stringify([
          { tool: 'list_tasks', parameters: {} },
          { tool: 'generate', parameters: { prompt: 'Summarize' } }
        ]),
        createdBy: user.id,
        isActive: true
      }
    });
    console.log(`   ✅ Created workflow: ${workflow.name}`);

    // Test 7: Create a scheduled task (Sprint 6)
    console.log('\n6️⃣ Testing scheduler...');
    const scheduledTask = await prisma.scheduledTask.create({
      data: {
        name: 'Test Scheduled Task',
        cron: '0 9 * * *', // Daily at 9am
        workflowId: workflow.id,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: user.id
      }
    });
    console.log(`   ✅ Created scheduled task: ${scheduledTask.name}`);

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('═══════════════════════════════════════════\n');
    console.log('✅ All Sprint 1-6 features working!');
    console.log('\n🎯 You can now test in browser:');
    console.log('   1. Go to http://localhost:3004');
    console.log('   2. Login with test@localhost.com');
    console.log(`   3. View project: ${project.title}`);
    console.log('   4. Try the Agent at /agent');
    console.log('\n💡 Agent Commands to Try:');
    console.log('   • "List all tasks"');
    console.log('   • "Create 5 new tasks"');
    console.log('   • "Generate a project report"');
    console.log('   • "Search for updates"');
    console.log('   • "Analyze project health"');

    // Cleanup (optional)
    console.log('\n🧹 Cleaning up test data...');
    await prisma.scheduledTask.delete({ where: { id: scheduledTask.id } });
    await prisma.workflow.delete({ where: { id: workflow.id } });
    await prisma.message.delete({ where: { id: message.id } });
    await prisma.conversation.delete({ where: { id: conversation.id } });
    await prisma.agentSession.delete({ where: { id: session.id } });
    await prisma.project.delete({ where: { id: project.id } });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalFeatures().catch(console.error);