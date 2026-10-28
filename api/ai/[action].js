import chatResponse from "../_lib/widget/chatResponse.js";
import recordVisitor from "../_lib/widget/recordVisitor.js";
import demo from "../_lib/widget/demo.js";
import { withMonitoring } from "../_lib/monitoring.js";

// Endpoints the chat widget calls, served by one function to stay within
// Vercel's function limit (generate-faq.js keeps its own, with a longer timeout):
//   POST /api/ai/chat-response   an AI reply for a visitor's question
//   POST /api/ai/record          save a lead, analytics event, unanswered question or rating
//   POST /api/ai/demo            the homepage demo: a visitor's site with Askio on it
const HANDLERS = {
  "chat-response": chatResponse,
  record: recordVisitor,
  demo,
};

function handler(req, res) {
  const route = HANDLERS[req.query.action];
  if (!route) return res.status(404).json({ error: "Not found." });
  return route(req, res);
}

export default withMonitoring("ai", handler);
