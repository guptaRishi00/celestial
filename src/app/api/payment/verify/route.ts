import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureUserBillingFields,
  getChatTokens,
  getUnlockedReports,
  normalizePurchaseType,
  PURCHASES,
  TOKEN_REFILL_AMOUNT,
  type UserBillingDocument,
} from "@/lib/billing";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

interface RazorpayOrderSnapshot {
  amount?: number | string;
  currency?: string;
  notes?: Record<string, string | number>;
}

function getRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function signatureMatches(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !ObjectId.isValid(authUser.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      razorpay_order_id?: unknown;
      razorpay_payment_id?: unknown;
      razorpay_signature?: unknown;
      type?: unknown;
      userId?: unknown;
    };

    const razorpayOrderId =
      typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const razorpayPaymentId =
      typeof body.razorpay_payment_id === "string"
        ? body.razorpay_payment_id
        : "";
    const razorpaySignature =
      typeof body.razorpay_signature === "string"
        ? body.razorpay_signature
        : "";
    const type = normalizePurchaseType(body.type);

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !type) {
      return NextResponse.json(
        { error: "Invalid payment payload" },
        { status: 400 },
      );
    }

    if (typeof body.userId === "string" && body.userId !== authUser.userId) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("Razorpay credentials are not configured");
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!signatureMatches(expectedSignature, razorpaySignature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    const order = (await razorpay.orders.fetch(
      razorpayOrderId,
    )) as RazorpayOrderSnapshot;
    const orderType = normalizePurchaseType(order.notes?.purchaseType);

    if (
      orderType !== type ||
      String(order.notes?.userId || "") !== authUser.userId ||
      Number(order.amount) !== PURCHASES[type].amountInr * 100
    ) {
      return NextResponse.json(
        { error: "Order verification failed" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new ObjectId(authUser.userId);
    await ensureUserBillingFields(db, userId);
    const users = db.collection<UserBillingDocument>("users");

    const payments = db.collection("payments");
    const reportUnlockId =
      type === "report"
        ? `report_${Date.now()}_${razorpayPaymentId.slice(-8)}`
        : null;

    const paymentRecord = await payments.updateOne(
      { razorpayPaymentId },
      {
        $setOnInsert: {
          userId,
          razorpayOrderId,
          razorpayPaymentId,
          purchaseType: type,
          amount: Number(order.amount),
          currency: order.currency || "INR",
          tokenAmount: type === "tokens" ? TOKEN_REFILL_AMOUNT : 0,
          reportUnlockId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    if (paymentRecord.matchedCount > 0) {
      const [existingPayment, currentUser] = await Promise.all([
        payments.findOne({ razorpayPaymentId }),
        users.findOne(
          { _id: userId },
          { projection: { chatTokens: 1, unlockedReports: 1 } },
        ),
      ]);

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        chatTokens: currentUser ? getChatTokens(currentUser) : 0,
        reportUnlockId: existingPayment?.reportUnlockId || null,
      });
    }

    if (type === "tokens") {
      await users.updateOne(
        { _id: userId },
        { $inc: { chatTokens: TOKEN_REFILL_AMOUNT } },
      );
    } else {
      if (!reportUnlockId) {
        throw new Error("Missing report unlock id");
      }
      await users.updateOne(
        { _id: userId },
        { $push: { unlockedReports: reportUnlockId } },
      );
    }

    const updatedUser = await users.findOne(
      { _id: userId },
      { projection: { chatTokens: 1, unlockedReports: 1 } },
    );

    return NextResponse.json({
      success: true,
      chatTokens: updatedUser ? getChatTokens(updatedUser) : 0,
      unlockedReports: updatedUser ? getUnlockedReports(updatedUser) : [],
      reportUnlockId,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
