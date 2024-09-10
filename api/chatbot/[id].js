import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGINS || "*"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Set content type to JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  // Validate id
  if (
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      id
    )
  ) {
    res.status(400).json({ error: "Invalid chatbot ID" });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("chatbot_configs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Sanitize the data before sending it to the client
    const sanitizedData = {
      id: data.id,
      title: data.title,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      position: data.position,
      initialMessage: data.initialMessage,
      placeholder: data.placeholder,
      faqData: data.faqData.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    };

    res.status(200).json(sanitizedData);
  } catch (error) {
    console.error("Error fetching chatbot config:", error);
    res.status(500).json({ error: "Failed to fetch chatbot configuration" });
  }
}
