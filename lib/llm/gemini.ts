import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
}

export interface LLMRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  images?: string[];
  enableWebSearch?: boolean;
}

export async function* streamGemini(
  req: LLMRequest
): AsyncGenerator<{ type: "text" | "thinking"; content: string }> {
  const model = getGenAI().getGenerativeModel({
    model: req.model,
    ...(req.enableWebSearch && {
      tools: [{ googleSearch: {} } as any],
    }),
  });

  const systemInstruction = req.messages.find(
    (m) => m.role === "system"
  )?.content;
  const userMessages = req.messages.filter((m) => m.role !== "system");

  // Build history (all except last message)
  const history = userMessages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMsg = userMessages[userMessages.length - 1];

  // Build parts for last message
  const parts: any[] = [];
  if (req.images?.length) {
    for (const url of req.images) {
      // Handle base64 data URLs
      if (url.startsWith("data:")) {
        const [meta, data] = url.split(",");
        const mimeType = meta.split(":")[1].split(";")[0];
        parts.push({ inlineData: { mimeType, data } });
      }
    }
  }
  parts.push({ text: lastMsg.content });

  const chat = model.startChat({
    history,
    ...(systemInstruction && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
  });

  const result = await chat.sendMessageStream(parts);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield { type: "text", content: text };
    }
    // Check for thinking/reasoning in candidates
    const candidate = chunk.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if ((part as any).thought) {
          yield { type: "thinking", content: (part as any).text || "" };
        }
      }
    }
  }
}

export async function callGemini(req: LLMRequest): Promise<string> {
  let result = "";
  for await (const chunk of streamGemini(req)) {
    if (chunk.type === "text") result += chunk.content;
  }
  return result;
}
