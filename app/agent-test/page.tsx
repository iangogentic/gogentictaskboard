"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, XCircle, Info } from "lucide-react";

export default function AgentTestPage() {
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");

  // Create a new session
  const createSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus("Creating session...");

      const response = await fetch("/api/agent/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create session");
      }

      const data = await response.json();
      setSessionId(data.session.id);
      setStatus("Session created");
      return data.session.id;
    } catch (err: any) {
      setError(err.message);
      setStatus("Failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate a plan
  const generatePlan = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      setStatus("Generating plan...");

      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, request }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate plan");
      }

      const data = await response.json();
      setPlan(data.plan);
      setStatus("Plan generated");
      return data.plan;
    } catch (err: any) {
      setError(err.message);
      setStatus("Failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Approve and execute plan
  const executePlan = async (sessionId: string, planToApprove: any) => {
    try {
      setLoading(true);
      setError(null);
      setStatus("Approving plan...");

      // First approve the plan
      const approveResponse = await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          planId: planToApprove.id,
          approved: true,
        }),
      });

      if (!approveResponse.ok) {
        const data = await approveResponse.json();
        throw new Error(data.error || "Failed to approve plan");
      }

      setStatus("Executing plan...");

      // Then execute it
      const executeResponse = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!executeResponse.ok) {
        const data = await executeResponse.json();
        throw new Error(data.error || "Failed to execute plan");
      }

      const data = await executeResponse.json();
      setResult(data.result);
      setStatus("Execution complete");
      return data.result;
    } catch (err: any) {
      setError(err.message);
      setStatus("Failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!request.trim()) {
      setError("Please enter a request");
      return;
    }

    // Reset state
    setSessionId(null);
    setPlan(null);
    setResult(null);
    setError(null);

    // Create session
    const newSessionId = await createSession();
    if (!newSessionId) return;

    // Generate plan
    const newPlan = await generatePlan(newSessionId);
    if (!newPlan) return;

    // Auto-execute for testing
    if (window.confirm("Execute the generated plan?")) {
      await executePlan(newSessionId, newPlan);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Agent System Test</h1>

        {/* Input Section */}
        <Card className="bg-white/10 border-white/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Make a Request</h2>
          <Textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Try: 'Show me all projects' or 'Create a task called Test Task'"
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 mb-4"
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !request.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Request
              </>
            )}
          </Button>
        </Card>

        {/* Status Section */}
        {status !== "idle" && (
          <Alert className="mb-6 bg-white/10 border-white/20">
            <Info className="h-4 w-4" />
            <AlertDescription>Status: {status}</AlertDescription>
          </Alert>
        )}

        {/* Error Section */}
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-500/50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              Error: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Session Info */}
        {sessionId && (
          <Card className="bg-white/10 border-white/20 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">Session</h3>
            <p className="text-sm text-white/70 font-mono">{sessionId}</p>
          </Card>
        )}

        {/* Plan Section */}
        {plan && (
          <Card className="bg-white/10 border-white/20 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Generated Plan</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">{plan.title}</h4>
                <p className="text-sm text-white/70">{plan.description}</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <h5 className="font-medium mb-2">Steps:</h5>
                <ol className="list-decimal list-inside space-y-2">
                  {plan.steps?.map((step: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{step.title}</span>
                      <span className="text-white/70"> - {step.tool}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>
        )}

        {/* Result Section */}
        {result && (
          <Card className="bg-white/10 border-white/20 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              {result.success ? (
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="mr-2 h-5 w-5 text-red-500" />
              )}
              Execution Result
            </h3>
            <div className="space-y-3">
              <p className="text-sm">{result.summary}</p>
              {result.metrics && (
                <div className="text-xs text-white/70 space-y-1">
                  <p>Duration: {result.metrics.totalDuration}ms</p>
                  <p>Successful: {result.metrics.successfulSteps}</p>
                  <p>Failed: {result.metrics.failedSteps}</p>
                </div>
              )}
              {result.artifacts && result.artifacts.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <h5 className="font-medium mb-2">Artifacts:</h5>
                  <ul className="space-y-1">
                    {result.artifacts.map((artifact: any, index: number) => (
                      <li key={index} className="text-sm text-white/70">
                        {artifact.type}: {artifact.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
