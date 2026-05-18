import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureUserBillingFields,
  normalizePurchaseType,
  PURCHASES,
} from "@/lib/billing";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

function getRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return {
    keyId,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
}

export async function POST(request: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !ObjectId.isValid(authUser.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      type?: unknown;
      amount?: unknown;
    };
    const type = normalizePurchaseType(body.type);
    if (!type) {
      return NextResponse.json(
        { error: "Invalid purchase type" },
        { status: 400 },
      );
    }

    const purchase = PURCHASES[type];
    const requestedAmount = Number(body.amount ?? purchase.amountInr);
    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount !== purchase.amountInr
    ) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const db = await getDb();
    const userId = new ObjectId(authUser.userId);
    await ensureUserBillingFields(db, userId);

    const dbUser = await db
      .collection("users")
      .findOne({ _id: userId }, { projection: { dob: 1, birthTime: 1 } });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (type === "report" && (!dbUser.dob || !dbUser.birthTime)) {
      return NextResponse.json(
        { error: "Please add your birth details before buying a report." },
        { status: 400 },
      );
    }

    const { client, keyId } = getRazorpayClient();
    const order = await client.orders.create({
      amount: purchase.amountInr * 100,
      currency: "INR",
      receipt: `r_${authUser.userId.slice(-12)}_${Date.now()}`,
      notes: {
        userId: authUser.userId,
        purchaseType: type,
      },
    });

    return NextResponse.json({
      ...order,
      keyId,
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 },
    );
  }
}
