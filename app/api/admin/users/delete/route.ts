import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, id: true },
    });

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get request data
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Get user details before deletion
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete related data in correct order to handle foreign key constraints
    // 1. Delete Updates created by the user
    await prisma.update.deleteMany({
      where: { authorId: userId },
    });

    // 2. Delete Tasks assigned to the user
    await prisma.task.deleteMany({
      where: { assigneeId: userId },
    });

    // 3. Delete TimeEntries
    await prisma.timeEntry.deleteMany({
      where: { userId: userId },
    });

    // 4. Delete ProjectMember records
    await prisma.projectMember.deleteMany({
      where: { userId: userId },
    });

    // 5. Update Projects where user is PM - set to null
    await prisma.project.updateMany({
      where: { pmId: userId },
      data: { pmId: null },
    });

    // 6. Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.email} has been deleted`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
