import "dotenv/config";
import { AgentService } from "@/lib/agent/service";

async function main() {
  const sessionId = "5db0c6a4-0231-411b-b5ba-31976e6c8d72";
  const userId = "cmffons5g0001d0wgci2y9w3y";
  const agentService = AgentService.getInstance();

  const before = await agentService.getSessionStatus(sessionId);
  console.log("Before approval:", {
    state: before?.state,
    hasPlan: !!before?.plan,
    planSteps: before?.plan?.steps?.length,
  });

  await agentService.approvePlan(sessionId, userId);

  const after = await agentService.getSessionStatus(sessionId);
  console.log("After approval:", {
    state: after?.state,
    hasPlan: !!after?.plan,
    planApprovedAt: after?.plan?.approvedAt,
  });
}

main().catch((err) => {
  console.error("Error during approval test:", err);
  process.exit(1);
});
