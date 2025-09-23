import "dotenv/config";
import { AgentService } from "@/lib/agent/service";

async function main() {
  const userId = "cmffons5g0001d0wgci2y9w3y";
  const agentService = AgentService.getInstance();

  const session = await agentService.createSession(userId);
  console.log("Created session", session.id);

  const plan = await agentService.generatePlan(
    session.id,
    "Create a test project"
  );
  console.log("Generated plan", { id: plan.id, steps: plan.steps.length });

  await agentService.approvePlan(session.id, userId);
  console.log("Plan approved");

  const result = await agentService.executePlan(session.id);
  console.log("Execution result", {
    success: result.success,
    summary: result.summary,
  });
}

main().catch((err) => {
  console.error("Error running agent flow:", err);
  process.exit(1);
});
