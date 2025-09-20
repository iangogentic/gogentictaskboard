import { AutonomousChat } from "@/components/autonomous-chat";

export default function TestAutonomousPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Autonomous AI Agent Test
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This agent has full database access. It can read, create, update,
            and delete data without predefined functions. It writes actual
            Prisma queries based on your requests.
          </p>
        </div>

        <AutonomousChat />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🚀 What's Different
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  No predefined functions - writes queries dynamically
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Full CRUD operations on any table</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Persistent memory across conversations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Autonomous decision making</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              💡 Example Requests
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>"Set up everything for a new client project"</li>
              <li>
                "Find projects that are behind schedule and update their status"
              </li>
              <li>"Create a weekly report of all project progress"</li>
              <li>"Assign unassigned tasks to available developers"</li>
              <li>"Clean up completed projects older than 6 months"</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ Testing Environment
          </h3>
          <p className="text-sm text-yellow-800">
            This agent has full database access. In production, you would add
            authentication, rate limiting, and audit logging. The agent can
            modify real data, so use with caution.
          </p>
        </div>
      </div>
    </div>
  );
}
