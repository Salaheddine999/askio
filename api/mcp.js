import { requireApiKey } from "./_lib/apiKeys.js";
import { TOOLS } from "./_lib/mcp/tools.js";
import { reportError, withMonitoring } from "./_lib/monitoring.js";
import { noteAiFailure } from "./_lib/aiHealth.js";
import { takeRateLimit } from "./_lib/rateLimit.js";

// POST /api/mcp: Askio's MCP server (Model Context Protocol, Streamable HTTP
// transport), so an owner's AI assistant can set up and manage their chatbots.
// It is stateless: every request carries the owner's API key
// (Authorization: Bearer askio_…, made in Settings) and gets one JSON answer;
// there are no sessions or server-sent streams.

const SERVER_INFO = { name: "askio", title: "Askio", version: "1.0.0" };
/** Newest first; a client asking for another version is offered the newest. */
const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const CALLS_PER_MINUTE = 60;

const INSTRUCTIONS =
  "Askio puts an FAQ chatbot on a website. Use list_chatbots to find a chatbot, create_chatbot to make one, " +
  "add_faqs to teach it, and get_install_code for the line that goes on the website. " +
  "Changes are live on the owner's website as soon as they are saved.";

// JSON-RPC error codes.
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

const ok = (id, result) => ({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

const toolResult = (data, isError = false) => ({
  content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
  isError,
});

async function callTool(uid, params) {
  const tool = TOOLS.find((t) => t.name === params?.name);
  if (!tool) return null;

  const args = params.arguments && typeof params.arguments === "object" ? params.arguments : {};
  try {
    return toolResult(await tool.run(uid, args));
  } catch (error) {
    // The AI provider itself failed (quota, timeout, outage), not the request.
    if (error.aiStatus !== undefined) await noteAiFailure(error.aiStatus, "faq");
    // Errors raised on purpose carry a statusCode and a message the assistant
    // can act on. Anything else is ours: reported, and kept out of the answer.
    if (error.statusCode) return toolResult(error.message, true);
    console.error(`MCP tool ${tool.name} failed:`, error);
    reportError(error, { route: "mcp", tool: tool.name });
    return toolResult("Something went wrong on Askio's side. Please try again.", true);
  }
}

/** Answers one JSON-RPC message; notifications get no answer (null). */
async function answer(uid, message) {
  if (!message || typeof message !== "object" || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return fail(message?.id, INVALID_REQUEST, "Not a JSON-RPC 2.0 request.");
  }
  const { id, method, params } = message;
  if (id === undefined || id === null) return null;

  switch (method) {
    case "initialize": {
      const asked = params?.protocolVersion;
      return ok(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, {
        // `run` is ours; the rest is the tool's public description.
        tools: TOOLS.map(({ run: _run, ...tool }) => tool),
      });
    case "tools/call": {
      if (!(await takeRateLimit(`mcp_${uid}`, CALLS_PER_MINUTE))) {
        return ok(id, toolResult("Too many calls this minute. Wait a moment and try again.", true));
      }
      const result = await callTool(uid, params);
      return result ? ok(id, result) : fail(id, INVALID_PARAMS, `Unknown tool: ${String(params?.name)}`);
    }
    default:
      return fail(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

async function handler(req, res) {
  if (req.method !== "POST") {
    // No server-sent stream to open (GET) and no session to end (DELETE).
    res.setHeader("Allow", "POST");
    return res.status(405).json(fail(null, INVALID_REQUEST, "Use POST."));
  }

  let uid;
  try {
    ({ uid } = await requireApiKey(req));
  } catch (error) {
    if (error.statusCode !== 401) throw error;
    res.setHeader("WWW-Authenticate", 'Bearer realm="Askio"');
    return res.status(401).json(fail(null, INVALID_REQUEST, error.message));
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json(fail(null, PARSE_ERROR, "The body must be JSON."));
  }

  // Older protocol versions allow several messages in one request.
  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > 20) {
      return res.status(400).json(fail(null, INVALID_REQUEST, "Send between 1 and 20 messages."));
    }
    const answers = [];
    for (const message of body) {
      const reply = await answer(uid, message);
      if (reply) answers.push(reply);
    }
    return answers.length ? res.status(200).json(answers) : res.status(202).end();
  }

  const reply = await answer(uid, body);
  return reply ? res.status(200).json(reply) : res.status(202).end();
}

export default withMonitoring("mcp", handler);
