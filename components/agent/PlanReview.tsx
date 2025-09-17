"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  Eye,
  Shield,
  Clock,
  FileText,
  Database,
  MessageSquare,
  HardDrive,
  Brain,
} from "lucide-react";

interface PlanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  tool: string;
  parameters: Record<string, any>;
  mutates: boolean;
  scopes: string[];
  estimatedDuration?: number;
  dryRunResult?: {
    preview?: string;
    changes?: string[];
    warnings?: string[];
  };
}

interface AgentPlan {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
  estimatedDuration?: number;
  risks?: string[];
  dependencies?: string[];
  createdAt: Date;
}

interface PlanReviewProps {
  plan: AgentPlan;
  onApprove: (planId: string) => Promise<void>;
  onReject: (planId: string, reason?: string) => Promise<void>;
  onDryRun: (planId: string) => Promise<void>;
  isDryRunning?: boolean;
  isApproving?: boolean;
}

export function PlanReview({
  plan,
  onApprove,
  onReject,
  onDryRun,
  isDryRunning = false,
  isApproving = false,
}: PlanReviewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStep, setSelectedStep] = useState<PlanStep | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const getToolIcon = (toolName: string) => {
    if (
      toolName.includes("database") ||
      toolName.includes("create") ||
      toolName.includes("update")
    ) {
      return <Database className="h-4 w-4" />;
    }
    if (toolName.includes("slack")) {
      return <MessageSquare className="h-4 w-4" />;
    }
    if (toolName.includes("drive")) {
      return <HardDrive className="h-4 w-4" />;
    }
    if (toolName.includes("rag")) {
      return <Brain className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getImpactBadge = (mutates: boolean, scopes: string[]) => {
    if (!mutates) {
      return <Badge variant="secondary">Read-only</Badge>;
    }

    const hasDelete = scopes.some((s) => s.includes("delete"));
    const hasAdmin = scopes.some((s) => s.includes("admin"));

    if (hasDelete || hasAdmin) {
      return <Badge variant="destructive">High Impact</Badge>;
    }

    return <Badge variant="default">Mutates Data</Badge>;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "Unknown";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const redactSensitiveParams = (params: Record<string, any>) => {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "apiKey",
      "credential",
    ];
    const redacted = { ...params };

    Object.keys(redacted).forEach((key) => {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        redacted[key] = "***REDACTED***";
      }
    });

    return redacted;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{plan.title}</CardTitle>
              <CardDescription className="mt-2">
                {plan.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-4">
              {plan.steps.length} steps
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Est. Duration: {formatDuration(plan.estimatedDuration)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {plan.steps.filter((s) => s.mutates).length} mutations
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {plan.risks?.length || 0} risks identified
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="dry-run">Dry Run</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {plan.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedStep(step)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-2">
                            {getToolIcon(step.tool)}
                            {step.title}
                          </h4>
                          {getImpactBadge(step.mutates, step.scopes)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Tool: {step.tool}</span>
                          {step.estimatedDuration && (
                            <span>
                              ~{formatDuration(step.estimatedDuration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          {selectedStep ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Step {selectedStep.order}: {selectedStep.title}
                </CardTitle>
                <CardDescription>{selectedStep.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Tool</h4>
                  <div className="flex items-center gap-2">
                    {getToolIcon(selectedStep.tool)}
                    <code className="text-sm">{selectedStep.tool}</code>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Parameters</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(
                      redactSensitiveParams(selectedStep.parameters),
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Required Permissions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStep.scopes.map((scope) => (
                      <Badge key={scope} variant="outline">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Impact</h4>
                  {getImpactBadge(selectedStep.mutates, selectedStep.scopes)}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStep(null)}
                >
                  Back to list
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Select a step</AlertTitle>
              <AlertDescription>
                Click on a step in the Overview tab to see details
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="dry-run" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dry Run Results</CardTitle>
              <CardDescription>
                Preview changes without affecting real data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.steps.some((s) => s.dryRunResult) ? (
                <div className="space-y-4">
                  {plan.steps
                    .filter((s) => s.dryRunResult)
                    .map((step) => (
                      <div key={step.id} className="space-y-2">
                        <h4 className="font-medium">{step.title}</h4>

                        {step.dryRunResult?.preview && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-mono">
                              {step.dryRunResult.preview}
                            </p>
                          </div>
                        )}

                        {step.dryRunResult?.changes &&
                          step.dryRunResult.changes.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Changes:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {step.dryRunResult.changes.map(
                                  (change, idx) => (
                                    <li key={idx}>{change}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {step.dryRunResult?.warnings &&
                          step.dryRunResult.warnings.length > 0 && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Warnings</AlertTitle>
                              <AlertDescription>
                                <ul className="list-disc list-inside mt-2">
                                  {step.dryRunResult.warnings.map(
                                    (warning, idx) => (
                                      <li key={idx}>{warning}</li>
                                    )
                                  )}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No dry run results yet
                  </p>
                  <Button
                    onClick={() => onDryRun(plan.id)}
                    disabled={isDryRunning}
                    className="mt-4"
                  >
                    {isDryRunning ? (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Dry Run
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              {plan.risks && plan.risks.length > 0 ? (
                <div className="space-y-3">
                  {plan.risks.map((risk, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{risk}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No risks identified</p>
              )}

              {plan.dependencies && plan.dependencies.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Dependencies</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {plan.dependencies.map((dep, index) => (
                      <li key={index}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Review Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => onApprove(plan.id)}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Execute
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => onDryRun(plan.id)}
                disabled={isDryRunning}
              >
                {isDryRunning ? (
                  <>
                    <Eye className="mr-2 h-4 w-4 animate-spin" />
                    Running Dry Run...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Dry Run
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="destructive"
              onClick={() => {
                if (rejectReason) {
                  onReject(plan.id, rejectReason);
                } else {
                  onReject(plan.id);
                }
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
