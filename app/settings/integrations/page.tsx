"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  type: string;
  connected: boolean;
  connectedAt?: string;
  data?: any;
}

function IntegrationsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Check for OAuth callback errors
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error === "google_auth_denied") {
      toast({
        title: "Google Drive authorization was cancelled",
        variant: "destructive",
      });
    } else if (error === "slack_auth_denied") {
      toast({
        title: "Slack authorization was cancelled",
        variant: "destructive",
      });
    }

    if (success === "google") {
      toast({
        title: "Successfully connected Google Workspace (Drive + Calendar)!",
      });
      fetchIntegrations();
    } else if (success === "slack") {
      toast({ title: "Successfully connected Slack!" });
      fetchIntegrations();
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchIntegrations();
    }
  }, [session]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
      toast({ title: "Failed to load integrations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleDrive = async () => {
    setConnecting("google_drive");
    try {
      // Initiate OAuth flow
      const response = await fetch("/api/google/auth", { method: "POST" });
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Failed to start Google Drive authorization",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Google Drive connection error:", error);
      toast({
        title: "Failed to connect Google Drive",
        variant: "destructive",
      });
      setConnecting(null);
    }
  };

  const connectSlack = async () => {
    setConnecting("slack");
    try {
      // Initiate Slack OAuth flow
      const response = await fetch("/api/slack/auth", { method: "POST" });
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Slack OAuth
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Failed to start Slack authorization",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Slack connection error:", error);
      toast({ title: "Failed to connect Slack", variant: "destructive" });
      setConnecting(null);
    }
  };

  const disconnectIntegration = async (type: string) => {
    try {
      const response = await fetch(`/api/integrations/${type}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: `Disconnected ${type === "google_drive" ? "Google Workspace" : "Slack"}`,
        });
        fetchIntegrations();
      } else {
        toast({
          title: "Failed to disconnect integration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Failed to disconnect integration",
        variant: "destructive",
      });
    }
  };

  const getIntegrationStatus = (type: string) => {
    return integrations.find((i) => i.type === type);
  };

  const googleIntegration = getIntegrationStatus("google_drive");
  const slackIntegration = getIntegrationStatus("slack");

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect your external services to enhance your project management
          experience
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Google Drive Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 87.3 78"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                    fill="#0066da"
                  />
                  <path
                    d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
                    fill="#00ac47"
                  />
                  <path
                    d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                    fill="#ea4335"
                  />
                  <path
                    d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                    fill="#00832d"
                  />
                  <path
                    d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                    fill="#2684fc"
                  />
                  <path
                    d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
                    fill="#ffba00"
                  />
                </svg>
                <CardTitle>Google Workspace</CardTitle>
              </div>
              {googleIntegration?.connected && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <CardDescription>
              Access Google Drive for file management and Google Calendar for
              meeting integration in your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {googleIntegration?.connected ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Connected on{" "}
                  {new Date(
                    googleIntegration.connectedAt!
                  ).toLocaleDateString()}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => disconnectIntegration("google_drive")}
                  className="w-full"
                >
                  Disconnect Google Workspace
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectGoogleDrive}
                disabled={connecting === "google_drive"}
                className="w-full"
              >
                {connecting === "google_drive" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Google Workspace"
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 127 127"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"
                    fill="#e01e5a"
                  />
                  <path
                    d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"
                    fill="#36c5f0"
                  />
                  <path
                    d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"
                    fill="#2eb67d"
                  />
                  <path
                    d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"
                    fill="#ecb22e"
                  />
                </svg>
                <CardTitle>Slack</CardTitle>
              </div>
              {slackIntegration?.connected && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <CardDescription>
              Send messages, create channels, and get project updates in your
              Slack workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slackIntegration?.connected ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Connected on{" "}
                  {new Date(slackIntegration.connectedAt!).toLocaleDateString()}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => disconnectIntegration("slack")}
                  className="w-full"
                >
                  Disconnect Slack
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectSlack}
                disabled={connecting === "slack"}
                className="w-full"
              >
                {connecting === "slack" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Slack"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Click "Connect" on the integration you want to enable</li>
          <li>You'll be redirected to authorize access</li>
          <li>Once approved, you'll return here with the integration active</li>
          <li>
            The AI agent will automatically use these integrations when you ask
            it to
          </li>
        </ol>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
