import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { GoogleServices } from "@/lib/google-services";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const googleServices = GoogleServices.getInstance();

    // Try to get upcoming events (broader time range)
    const events = await googleServices.getUpcomingEvents(session.user.id, 10);

    return NextResponse.json({
      success: true,
      message: `Found ${events.length} upcoming events`,
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary || "No title",
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        hangoutLink: event.hangoutLink,
      })),
      debug: {
        userId: session.user.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Calendar test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch calendar events",
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
