import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const db = await getDb();

    // Fetch specific chat messages
    if (chatId) {
      if (!ObjectId.isValid(chatId)) {
        return Response.json({ error: "Invalid chat ID" }, { status: 400 });
      }
      
      const chatDoc = await db.collection("chats").findOne({
        _id: new ObjectId(chatId),
        userId: new ObjectId(authUser.userId),
      });

      if (!chatDoc) {
        return Response.json({ error: "Chat not found" }, { status: 404 });
      }

      return Response.json({ messages: chatDoc.messages || [] });
    }

    // Fetch list of all chats for the user
    const chats = await db.collection("chats")
      .find({ userId: new ObjectId(authUser.userId) })
      .project({ _id: 1, title: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .toArray();

    return Response.json({ chats });
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    
    if (!chatId || !ObjectId.isValid(chatId)) {
      return Response.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("chats").deleteOne({
      _id: new ObjectId(chatId),
      userId: new ObjectId(authUser.userId)
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
