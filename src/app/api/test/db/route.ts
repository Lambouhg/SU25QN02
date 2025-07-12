import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const startTime = Date.now();
    await connectDB();
    const endTime = Date.now();
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      connectionTime: `${endTime - startTime}ms`
    });
    
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
