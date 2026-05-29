/**
 * Slack Incoming Webhook 通知。
 * SLACK_WEBHOOK_URL 未設定時はコンソール出力のみ（プレビュー用）。
 *
 * 通知タイミング（要件 ヒアリング結果より）:
 *   - 請求書アップロード受領時 → 運営チームに通知
 *   - 差戻し時 → アップロード元に通知（こちらはメール想定だが、初期はSlack）
 */

export type SlackNotify = {
  title: string;
  body: string;
  fields?: { label: string; value: string }[];
  url?: string;
};

export async function notifySlack(payload: SlackNotify): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.log("[slack:mock]", payload);
    return;
  }
  const blocks: unknown[] = [
    { type: "header", text: { type: "plain_text", text: payload.title } },
    { type: "section", text: { type: "mrkdwn", text: payload.body } },
  ];
  if (payload.fields?.length) {
    blocks.push({
      type: "section",
      fields: payload.fields.map((f) => ({
        type: "mrkdwn",
        text: `*${f.label}*\n${f.value}`,
      })),
    });
  }
  if (payload.url) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "開く" },
          url: payload.url,
        },
      ],
    });
  }
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
  } catch (e) {
    console.error("[slack] notify failed", e);
  }
}
