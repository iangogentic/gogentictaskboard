/**
 * Session cleanup utility for agent system
 * Prevents memory leaks by expiring old sessions
 */

import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

const SESSION_EXPIRY_HOURS = 24; // Sessions expire after 24 hours
const CLEANUP_INTERVAL_MINUTES = 60; // Run cleanup every hour

export class SessionCleanup {
  private static instance: SessionCleanup;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SessionCleanup {
    if (!SessionCleanup.instance) {
      SessionCleanup.instance = new SessionCleanup();
    }
    return SessionCleanup.instance;
  }

  /**
   * Start automatic session cleanup
   */
  startAutoCleanup() {
    if (this.cleanupTimer) {
      return; // Already running
    }

    // Run cleanup immediately, then on interval
    this.cleanupExpiredSessions();

    this.cleanupTimer = setInterval(
      () => this.cleanupExpiredSessions(),
      CLEANUP_INTERVAL_MINUTES * 60 * 1000
    );

    console.log("Session cleanup service started");
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log("Session cleanup service stopped");
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() - SESSION_EXPIRY_HOURS);

      // Find expired sessions
      const expiredSessions = await prisma.agentSession.findMany({
        where: {
          createdAt: {
            lt: expiryDate,
          },
          state: {
            notIn: ["completed", "failed"], // Don't delete completed/failed sessions for audit
          },
        },
        select: {
          id: true,
          userId: true,
          state: true,
        },
      });

      if (expiredSessions.length === 0) {
        return;
      }

      console.log(`Cleaning up ${expiredSessions.length} expired sessions`);

      // Mark sessions as expired
      await prisma.agentSession.updateMany({
        where: {
          id: {
            in: expiredSessions.map((s) => s.id),
          },
        },
        data: {
          state: "failed",
          error: "Session expired due to inactivity",
          updatedAt: new Date(),
        },
      });

      // Log the cleanup
      for (const session of expiredSessions) {
        await AuditLogger.logSuccess(
          session.userId,
          "session_expired",
          "session",
          session.id,
          {
            previousState: session.state,
            expiryHours: SESSION_EXPIRY_HOURS,
          }
        );
      }

      console.log(`Successfully cleaned up ${expiredSessions.length} sessions`);
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
    }
  }

  /**
   * Clean up a specific session
   */
  async cleanupSession(sessionId: string) {
    try {
      const session = await prisma.agentSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return;
      }

      // Mark as cleaned up
      await prisma.agentSession.update({
        where: { id: sessionId },
        data: {
          state: "failed",
          error: "Manual cleanup",
          updatedAt: new Date(),
        },
      });

      await AuditLogger.logSuccess(
        session.userId,
        "session_cleanup",
        "session",
        sessionId,
        {
          previousState: session.state,
        }
      );
    } catch (error) {
      console.error(`Failed to cleanup session ${sessionId}:`, error);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const stats = await prisma.agentSession.groupBy({
      by: ["state"],
      _count: true,
    });

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() - SESSION_EXPIRY_HOURS);

    const expiredCount = await prisma.agentSession.count({
      where: {
        createdAt: {
          lt: expiryDate,
        },
        state: {
          notIn: ["completed", "failed"],
        },
      },
    });

    return {
      byState: stats,
      pendingExpiry: expiredCount,
      expiryHours: SESSION_EXPIRY_HOURS,
    };
  }
}

// Export singleton instance
export const sessionCleanup = SessionCleanup.getInstance();
