import { createParser } from "eventsource-parser";

async function* streamAsyncIterable(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) {
    return;
  }
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// Copy from of https://github.com/yetone/openai-translator/blob/bd583c2aecd74c51346261a0f5da84d6905a3f05/src/content_script/utils.ts#L69
export async function fetchServerSentEvents(
  url: string,
  options: Parameters<typeof fetch>[1] & { onMessage: (data: string) => void }
) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    let reason: string;

    try {
      reason = await res.text();
    } catch (err) {
      reason = res.statusText;
    }

    const message = `OpenAI error ${res.status}: ${reason}`;

    throw {
      message,
      type: res.statusText,
      code: res.status,
    };
  }

  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });

  for await (const chunk of streamAsyncIterable(res.body)) {
    const str = new TextDecoder().decode(chunk);
    parser.feed(str);
  }
}
