import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    // Test different types of errors for Sentry
    const testType = Math.random();

    if (testType < 0.33) {
      // Test a regular error
      throw new Error(
        "Test error: This is a controlled test of Sentry error tracking"
      );
    } else if (testType < 0.66) {
      // Test a custom error with extra context
      const error = new Error("Test error with context");
      Sentry.withScope((scope) => {
        scope.setContext("test_details", {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          test_id: Math.random().toString(36).substring(7),
        });
        scope.setLevel("warning");
        Sentry.captureException(error);
      });
      throw error;
    } else {
      // Test a breadcrumb trail
      Sentry.addBreadcrumb({
        message: "User triggered test",
        level: "info",
        data: {
          action: "test-sentry-endpoint",
          timestamp: Date.now(),
        },
      });

      // Simulate a database error
      throw new Error("Test database connection error");
    }
  } catch (error) {
    // Sentry should automatically capture this
    console.error("Sentry test error:", error);

    return NextResponse.json(
      {
        error: "Sentry test error triggered successfully",
        message: error instanceof Error ? error.message : "Unknown error",
        note: "Check your Sentry dashboard for this error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Test a different error scenario
  Sentry.captureMessage("Test message: Manual Sentry message from API", "info");

  return NextResponse.json({
    success: true,
    message: "Sentry test message sent",
    dashboard: "https://sentry.io/organizations/gogentic/projects/portal",
  });
}
