import type { Lead } from "@/lib/leads/schema";

export async function notifyLeadCreated(_lead: Lead): Promise<{ sent: boolean; reason: string }> {
  if (process.env.TELEGRAM_NOTIFICATIONS !== "enabled") {
    return { sent: false, reason: "disabled" };
  }
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return { sent: false, reason: "not_configured" };
  }
  return { sent: false, reason: "adapter_stubbed_until_explicit_approval" };
}
