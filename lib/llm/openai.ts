import OpenAI from "openai";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface LLMRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  images?: string[];
  enableWebSearch?: boolean;
}

export async function* streamOpenAI(req: LLMRequest): AsyncGenerator<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  for (const msg of req.messages) {
    if (msg.role === "user" && req.images?.length) {
      const content: OpenAI.ChatCompletionContentPart[] = [
        { type: "text", text: msg.content },
        ...req.images.map(
          (url): OpenAI.ChatCompletionContentPart => ({
            type: "image_url",
            image_url: { url },
          })
        ),
      ];
      messages.push({ role: "user", content });
    } else {
      messages.push(msg);
    }
  }

  const tools: OpenAI.ChatCompletionTool[] | undefined = req.enableWebSearch
    ? [{ type: "function", function: { name: "web_search", description: "Search the web for current information", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } }]
    : undefined;

  const stream = await getClient().chat.completions.create({
    model: req.model,
    messages,
    stream: true,
    tools,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      yield delta.content;
    }
  }
}

export async function callOpenAI(req: LLMRequest): Promise<string> {
  let result = "";
  for await (const chunk of streamOpenAI(req)) {
    result += chunk;
  }
  return result;
}
