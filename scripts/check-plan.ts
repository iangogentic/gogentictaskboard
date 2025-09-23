import "dotenv/config";
import { AgentService } from "@/lib/agent/service";

async function main() {
  const userId = "cmffons5g0001d0wgci2y9w3y";
  const agentService = AgentService.getInstance();

  const session = await agentService.createSession(userId);
  console.log("Session created", session.id);

  const plan = await agentService.generatePlan(session.id, "Test plan issue");
  console.log("Plan generated", { planId: plan.id, steps: plan.steps.length });

  const sessionAfter = await agentService.getSessionStatus(session.id);
  console.log("Session after plan", {
    state: sessionAfter?.state,
    hasPlan: !!sessionAfter?.plan,
    planId: sessionAfter?.plan?.id,
    planSteps: sessionAfter?.plan?.steps?.length,
  });
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
