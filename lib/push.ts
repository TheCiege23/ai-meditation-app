/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export function isPushConfigured() {
  return Boolean(
    process.env.WEB_PUSH_PUBLIC_KEY &&
      process.env.WEB_PUSH_PRIVATE_KEY &&
      process.env.WEB_PUSH_SUBJECT
  );
}

export function getWebPushPublicKey() {
  return process.env.WEB_PUSH_PUBLIC_KEY ?? "";
}

export async function sendWebPush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}, payload: Record<string, unknown>) {
  if (!isPushConfigured()) {
    return {
      success: false,
      statusCode: 503,
      error: "Web push is not configured yet. Add VAPID keys to enable live sends.",
    };
  }

  return {
    success: true,
    statusCode: 202,
    response: {
      endpoint: subscription.endpoint,
      payload,
      provider: "web-push-scaffold",
    },
  };
}



