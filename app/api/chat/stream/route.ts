import { createServerClient } from "@/lib/supabase/server";
import { streamChain, type AgentConfig } from "@/lib/llm/stream";
import { generateTitle } from "@/lib/utils";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await req.json();
  const { sessionId, accessCode, userInput, agents, images } = body as {
    sessionId: string;
    accessCode: string;
    userInput: string;
    agents: AgentConfig[];
    images?: string[];
  };

  if (!accessCode || !userInput || !agents?.length) {
    return new Response("Missing required fields", { status: 400 });
  }

  const supabase = createServerClient();

  // Verify access code
  const { data: codeData } = await supabase
    .from("cc_access_codes")
    .select("id")
    .eq("code", accessCode)
    .eq("is_active", true)
    .single();

  if (!codeData) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Create or use existing session
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const { data: session } = await supabase
      .from("cc_sessions")
      .insert({
        access_code: accessCode,
        title: generateTitle(userInput),
      })
      .select("id")
      .single();
    currentSessionId = session?.id;
  }

  // Save user message
  const { data: userMessage } = await supabase
    .from("cc_messages")
    .insert({
      session_id: currentSessionId,
      role: "user",
      content: userInput,
      attachments: images?.map((url) => ({ type: "image", url })) || [],
      chain_config: { agents },
    })
    .select("id")
    .single();

  // Create chain message placeholder
  const { data: chainMessage } = await supabase
    .from("cc_messages")
    .insert({
      session_id: currentSessionId,
      role: "chain",
      content: "",
      chain_config: { agents },
    })
    .select("id")
    .single();

  // Create agent step records
  const stepRecords = agents.map((agent, i) => ({
    message_id: chainMessage?.id,
    step_index: i,
    agent_name: agent.name,
    model: agent.model,
    provider: getProviderName(agent.model),
    system_prompt: agent.systemPrompt,
    input: i === 0 ? userInput : "",
    status: "pending",
  }));

  await supabase.from("cc_agent_steps").insert(stepRecords);

  // Stream the chain execution
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send session info first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "session",
              sessionId: currentSessionId,
              messageId: chainMessage?.id,
            })}\n\n`
          )
        );

        const agentOutputs: string[] = [];
        let currentAgentIndex = -1;
        const startTimes: number[] = [];

        for await (const event of streamChain(agents, userInput, images)) {
          // Track agent transitions
          if (event.agentIndex !== currentAgentIndex) {
            // Finalize previous agent
            if (currentAgentIndex >= 0 && agentOutputs[currentAgentIndex]) {
              const duration = Date.now() - startTimes[currentAgentIndex];
              supabase
                .from("cc_agent_steps")
                .update({
                  output: agentOutputs[currentAgentIndex],
                  status: "complete",
                  duration_ms: duration,
                })
                .eq("message_id", chainMessage?.id)
                .eq("step_index", currentAgentIndex)
                .then(() => {});
            }

            currentAgentIndex = event.agentIndex;
            agentOutputs[currentAgentIndex] = "";
            startTimes[currentAgentIndex] = Date.now();

            // Update step to streaming
            supabase
              .from("cc_agent_steps")
              .update({ status: "streaming" })
              .eq("message_id", chainMessage?.id)
              .eq("step_index", currentAgentIndex)
              .then(() => {});

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "agent_start",
                  agentIndex: event.agentIndex,
                  agentName: event.agentName,
                })}\n\n`
              )
            );
          }

          if (event.type === "text") {
            agentOutputs[currentAgentIndex] += event.content;
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: event.type,
                content: event.content,
                agentIndex: event.agentIndex,
                agentName: event.agentName,
              })}\n\n`
            )
          );
        }

        // Finalize last agent
        if (currentAgentIndex >= 0 && agentOutputs[currentAgentIndex]) {
          const duration = Date.now() - startTimes[currentAgentIndex];
          await supabase
            .from("cc_agent_steps")
            .update({
              output: agentOutputs[currentAgentIndex],
              status: "complete",
              duration_ms: duration,
            })
            .eq("message_id", chainMessage?.id)
            .eq("step_index", currentAgentIndex);
        }

        // Update chain message with final output
        const finalOutput = agentOutputs[agentOutputs.length - 1] || "";
        await supabase
          .from("cc_messages")
          .update({ content: finalOutput })
          .eq("id", chainMessage?.id);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              content: err?.message || "Stream error",
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function getProviderName(model: string): string {
  if (model.includes("gpt") || model.includes("o4") || model.includes("o3") || model.includes("o1")) return "openai";
  if (model.includes("claude")) return "anthropic";
  if (model.includes("gemini")) return "google";
  return "openai";
}
