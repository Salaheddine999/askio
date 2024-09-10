import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log("API route called:", req.method, req.url);
  console.log("Environment variables:", {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "Set"
      : "Not set",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "Set"
      : "Not set",
  });

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,PUT,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  console.log("Requested chatbot ID:", id);

  // Validate id
  if (
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      id
    )
  ) {
    console.error("Invalid chatbot ID:", id);
    res.status(400).json({ error: "Invalid chatbot ID" });
    return;
  }

  try {
    console.log("Fetching chatbot config for ID:", id);
    const { data, error } = await supabase
      .from("chatbot_configs")
      .select("*")
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("Raw data received:", data);

    if (!data || data.length === 0) {
      console.error("No data found for chatbot ID:", id);
      res.status(404).json({ error: "Chatbot configuration not found" });
      return;
    }

    // Use the first result if multiple exist
    const chatbotConfig = data[0];

    // Sanitize the data before sending it to the client
    const sanitizedData = {
      id: chatbotConfig.id,
      title: chatbotConfig.title,
      primaryColor: chatbotConfig.primaryColor,
      secondaryColor: chatbotConfig.secondaryColor,
      position: chatbotConfig.position,
      initialMessage: chatbotConfig.initialMessage,
      placeholder: chatbotConfig.placeholder,
      faqData: chatbotConfig.faqData.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    };

    console.log("Sending chatbot config:", sanitizedData);
    res.status(200).json(sanitizedData);
  } catch (error) {
    console.error("Error in API route:", error);
    res
      .status(500)
      .json({
        error: "Failed to fetch chatbot configuration",
        details: error.message,
      });
  }
}
