"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SlackUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [slackUserId, setSlackUserId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchMappings();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const fetchMappings = async () => {
    const res = await fetch("/api/admin/slack-mapping");
    const data = await res.json();
    setMappings(data.mappings || []);
  };

  const handleSubmit = async () => {
    if (!selectedUser || !slackUserId) {
      alert("Please select a user and enter their Slack User ID");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/slack-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          slackUserId,
        }),
      });

      if (res.ok) {
        alert("Slack mapping created successfully!");
        setSelectedUser("");
        setSlackUserId("");
        fetchMappings();
      } else {
        alert("Failed to create mapping");
      }
    } catch (error) {
      alert("Error creating mapping");
    } finally {
      setLoading(false);
    }
  };

  const testMessage = async (userId: string) => {
    try {
      const res = await fetch("/api/slack/test-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert("Test message sent!");
      } else {
        alert("Failed to send test message");
      }
    } catch (error) {
      alert("Error sending test message");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Slack User Mapping</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Slack Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Select User</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Slack User ID</label>
              <Input
                placeholder="e.g., U024BE7LH (starts with U)"
                value={slackUserId}
                onChange={(e) => setSlackUserId(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Find this in Slack: Click on user → View full profile → More →
                Copy member ID
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Mapping"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Slack User ID</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => (
                <tr key={mapping.userId} className="border-b">
                  <td className="p-2">{mapping.userName || "Unknown"}</td>
                  <td className="p-2">{mapping.userEmail}</td>
                  <td className="p-2 font-mono">
                    {mapping.slackUserId || "Not set"}
                  </td>
                  <td className="p-2">
                    {mapping.isManual ? "Manual" : "OAuth"}
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testMessage(mapping.userId)}
                    >
                      Test DM
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
