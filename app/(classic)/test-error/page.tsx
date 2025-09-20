"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function TestErrorPage() {
  const [errorTriggered, setErrorTriggered] = useState(false);
  const [messagesSent, setMessagesSent] = useState(0);

  const triggerError = () => {
    try {
      // This will throw an error
      throw new Error(
        "Test Error: Sentry integration test from test-error page"
      );
    } catch (error) {
      Sentry.captureException(error);
      setErrorTriggered(true);
      console.error("Error captured by Sentry:", error);
    }
  };

  const sendMessage = () => {
    Sentry.captureMessage("Test Message: Manual test from UI", "info");
    setMessagesSent(messagesSent + 1);
  };

  const triggerUnhandledError = () => {
    // This will cause an unhandled error
    const obj: any = null;
    obj.nonExistentMethod(); // This will throw
  };

  useEffect(() => {
    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: "test",
      message: "Test error page loaded",
      level: "info",
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sentry Error Tracking Test</h1>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            Test Sentry Integration
          </h2>

          <div className="space-y-4">
            <div>
              <button
                onClick={triggerError}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Trigger Handled Error
              </button>
              {errorTriggered && (
                <p className="mt-2 text-green-600">
                  ✓ Error captured and sent to Sentry
                </p>
              )}
            </div>

            <div>
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send Test Message
              </button>
              {messagesSent > 0 && (
                <p className="mt-2 text-green-600">
                  ✓ {messagesSent} message(s) sent to Sentry
                </p>
              )}
            </div>

            <div>
              <button
                onClick={triggerUnhandledError}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Trigger Unhandled Error (Will crash page)
              </button>
              <p className="text-sm text-gray-600 mt-1">
                This will cause the page to crash
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Sentry Dashboard</h3>
            <p className="text-sm text-gray-600">
              Check your errors at:{" "}
              <a
                href="https://sentry.io/organizations/gogentic/projects/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://sentry.io/organizations/gogentic/projects/portal
              </a>
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm">
              <strong>Note:</strong> Sentry is only enabled in production.
              {process.env.NODE_ENV === "production" ? (
                <span className="text-green-600">
                  {" "}
                  ✓ Currently in production mode
                </span>
              ) : (
                <span className="text-orange-600">
                  {" "}
                  ⚠ Currently in {process.env.NODE_ENV} mode
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
