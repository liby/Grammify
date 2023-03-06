import { fetchServerSentEvents } from "./open-ai-stream";

interface Query {
  apiKey: string;
  model: string;
  prompt: string;
  stream?: boolean;
  url?: string;

  onFinish?: (reason: string) => void;
  onMessage: (message: { content: string; role: string }) => void;
}

export async function polish(query: Query): Promise<void> {
  const { apiKey, model, prompt, url, stream } = query;
  const apiRoute = url || "https://api.openai.com/v1/chat/completions";
  const body = {
    model,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
    // Inspired by https://github.com/yetone/bob-plugin-openai-polisher/blob/c2c371c141b3eed601e3b8375171c2f239d36fc9/src/main.js#L19
    messages: [
      {
        role: "system",
        content: "You're a writing assistant tool.",
      },
      {
        role: "user",
        content: `Revise the following sentences to make them more clear, concise, and coherent, please note that you need to list the changes and briefly explain why: \n\n ${prompt}.`,
      },
    ],
    stream,
  };
  const requestBody = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        apiKey || process.env.NEXT_PUBLIC_OPEN_AI_TOKEN
      }`,
    },
    method: "POST",
    body: JSON.stringify(body),
  };

  if (stream) {
    let isFirst = true;
    await fetchServerSentEvents(apiRoute, {
      ...requestBody,
      onMessage: (msg) => {
        let resp;
        try {
          resp = JSON.parse(msg);
        } catch {
          query.onFinish?.("stop");
          return;
        }
        const { choices } = resp;
        if (!choices || choices.length === 0) {
          return { error: "No result" };
        }
        const { delta, finish_reason: finishReason } = choices[0];
        if (finishReason) {
          query.onFinish?.(finishReason);
          return;
        }

        const { content = "", role } = delta;
        let targetText = content;

        if (
          (isFirst && targetText.startsWith('"')) ||
          targetText.startsWith("「")
        ) {
          targetText = targetText.slice(1);
        }

        if (!role) {
          isFirst = false;
        }

        query.onMessage({ content: targetText, role });
      },
    });
  } else {
    const response = await fetch(apiRoute, requestBody);
    const result = await response.json();
    query.onMessage(result.choices[0].message);
  }
}
