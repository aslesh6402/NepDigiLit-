import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

// GET /api/teacher/todos - Get all todos created by teachers
export async function GET(request: NextRequest) {
  try {
    // Extract teacher from authenticated session
    const teacher = await requireTeacher(request);
    const teacherId = teacher.id;

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");

    const where: any = { teacherId };

    if (moduleId) where.moduleId = moduleId;

    const todos = await prisma.todo.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        module: {
          select: { id: true, title: true },
        },
        progress: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Calculate completion statistics for each todo
    const todosWithStats = todos.map((todo) => ({
      ...todo,
      stats: {
        totalAssigned: todo.progress.length,
        completed: todo.progress.filter((p) => p.completed).length,
        pending: todo.progress.filter((p) => !p.completed).length,
        completionRate:
          todo.progress.length > 0
            ? (todo.progress.filter((p) => p.completed).length /
                todo.progress.length) *
              100
            : 0,
      },
    }));

    return NextResponse.json({ todos: todosWithStats });
  } catch (error) {
    console.error("Error fetching teacher todos:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    // Extract teacher from authenticated session
    const teacher = await requireTeacher(request);
    const teacherId = teacher.id;

    const body = await request.json();
    const {
      title,
      description,
      instructions,
      moduleId,
      priority = "MEDIUM",
      dueDate,
      assignToAllStudents = false,
      assignedStudentIds = [],
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        instructions,
        moduleId: moduleId || null,
        teacherId,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Auto-assign to students if specified
    if (assignToAllStudents || assignedStudentIds.length > 0) {
      let studentsToAssign = [];

      if (assignToAllStudents) {
        // Get all students
        const students = await prisma.user.findMany({
          where: { role: "STUDENT" },
          select: { id: true },
        });
        studentsToAssign = students.map((s) => s.id);
      } else {
        studentsToAssign = assignedStudentIds;
      }

      // Create todo progress entries for assigned students
      const progressEntries = studentsToAssign.map((studentId: string) => ({
        userId: studentId,
        todoId: todo.id,
        moduleId: moduleId || null,
        completed: false,
      }));

      await prisma.todoProgress.createMany({
        data: progressEntries,
      });
    }

    // Fetch the created todo with relations
    const createdTodo = await prisma.todo.findUnique({
      where: { id: todo.id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        module: {
          select: { id: true, title: true },
        },
        progress: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ todo: createdTodo }, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/todos - Update a todo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Todo ID is required" },
        { status: 400 }
      );
    }

    // Convert dueDate to Date object if provided
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        module: {
          select: { id: true, title: true },
        },
        progress: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ todo });
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/todos - Delete a todo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Todo ID is required" },
        { status: 400 }
      );
    }

    // Delete associated progress entries first
    await prisma.todoProgress.deleteMany({
      where: { todoId: id },
    });

    // Delete the todo
    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}
