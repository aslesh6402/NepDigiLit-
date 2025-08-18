import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function getUserFromRequest(request: NextRequest) {
  try {
    // First, try to get token from Authorization header (for API calls)
    let token = request.headers.get("authorization");
    if (token && token.startsWith("Bearer ")) {
      token = token.substring(7);
    } else {
      // If no Authorization header, try to get from cookies (for SSR)
      token = request.cookies.get("auth-token")?.value || null;
    }

    if (!token) {
      return null;
    }

    // Verify the JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as JWTPayload;

    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        grade: true,
        school: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error extracting user from request:", error);
    return null;
  }
}

export async function requireTeacher(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    throw new Error("Authentication required");
  }

  if (user.role !== "TEACHER") {
    throw new Error("Teacher access required");
  }

  return user;
}

export async function requireStudent(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    throw new Error("Authentication required");
  }

  if (user.role !== "STUDENT") {
    throw new Error("Student access required");
  }

  return user;
}
