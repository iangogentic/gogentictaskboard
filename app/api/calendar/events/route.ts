export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { GoogleServices } from "@/lib/google-services";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "today"; // "today" or "upcoming"

    const googleServices = GoogleServices.getInstance();

    let events;
    if (type === "today") {
      events = await googleServices.getTodaysMeetings(session.user.id);
    } else {
      events = await googleServices.getUpcomingEvents(session.user.id, 10);
    }

    // Format events for the frontend
    const formattedEvents = events.map((event) => ({
      id: event.id,
      summary: event.summary || "No title",
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      hangoutLink: event.hangoutLink,
      attendees: event.attendees?.map((a) => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
      })),
      status: event.status,
      htmlLink: event.htmlLink,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error: any) {
    console.error("Failed to fetch calendar events:", error);

    // Check if it's a permission error
    if (error.message?.includes("not connected")) {
      return NextResponse.json(
        {
          error:
            "Google Calendar not connected. Please connect your Google account first.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
