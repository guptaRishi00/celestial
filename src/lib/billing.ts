import type { Db, ObjectId, WithId } from "mongodb";

export const DEFAULT_CHAT_TOKENS = 20;
export const CHAT_MESSAGE_TOKEN_COST = 10;
export const TOKEN_REFILL_AMOUNT = 100;
export const TOKEN_REFILL_PRICE_INR = 50;
export const REPORT_PRICE_INR = 10;

export type PurchaseType = "tokens" | "report";

export const PURCHASES: Record<
  PurchaseType,
  { amountInr: number; description: string }
> = {
  tokens: {
    amountInr: TOKEN_REFILL_PRICE_INR,
    description: "Chat Token Refill",
  },
  report: {
    amountInr: REPORT_PRICE_INR,
    description: "Detailed Astrology Report",
  },
};

export interface BillingUserFields {
  chatTokens?: unknown;
  unlockedReports?: unknown;
}

export interface UserBillingDocument {
  _id: ObjectId;
  chatTokens: number;
  unlockedReports: string[];
}

export function normalizePurchaseType(value: unknown): PurchaseType | null {
  return value === "tokens" || value === "report" ? value : null;
}

export function getChatTokens(user: BillingUserFields): number {
  return typeof user.chatTokens === "number"
    ? user.chatTokens
    : DEFAULT_CHAT_TOKENS;
}

export function getUnlockedReports(user: BillingUserFields): string[] {
  return Array.isArray(user.unlockedReports)
    ? user.unlockedReports.filter(
        (report): report is string => typeof report === "string",
      )
    : [];
}

export async function ensureUserBillingFields(db: Db, userId: ObjectId) {
  const users = db.collection("users");

  await Promise.all([
    users.updateOne(
      {
        _id: userId,
        $or: [{ chatTokens: { $exists: false } }, { chatTokens: null }],
      },
      { $set: { chatTokens: DEFAULT_CHAT_TOKENS } },
    ),
    users.updateOne(
      {
        _id: userId,
        $or: [
          { unlockedReports: { $exists: false } },
          { unlockedReports: null },
        ],
      },
      { $set: { unlockedReports: [] } },
    ),
  ]);
}

export function toPublicUser(
  user: WithId<Record<string, unknown>> & BillingUserFields,
) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    dob: user.dob || null,
    birthTime: user.birthTime || null,
    birthPlace: user.birthPlace || null,
    gender: user.gender || null,
    createdAt: user.createdAt || null,
    chatTokens: getChatTokens(user),
    unlockedReports: getUnlockedReports(user),
  };
}
