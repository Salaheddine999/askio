import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    const docRef = doc(db, "chatbot_configs", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      res.status(400).json({ error: "Invalid chatbot ID" });
      return;
    }

    const data = docSnap.data();

    // Sanitize the data before sending it to the client
    const sanitizedData = {
      id: docRef.id,
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
