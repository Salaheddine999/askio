import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../utils/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

const ChatbotConfigurator: React.FC = () => {
  const [chatbots, setChatbots] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [newChatbotName, setNewChatbotName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    const chatbotsCollection = collection(db, "chatbot_configs");
    const snapshot = await getDocs(chatbotsCollection);
    const chatbotsList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setChatbots(chatbotsList as { id: string; name: string }[]);
  };

  const createNewChatbot = async () => {
    if (newChatbotName.trim()) {
      const user = auth.currentUser;
      if (!user) {
        setError("User not authenticated");
        return;
      }
      try {
        const docRef = await addDoc(collection(db, "chatbot_configs"), {
          name: newChatbotName,
          user_id: user.uid,
        });
        setNewChatbotName("");
        fetchChatbots();
        navigate(`/edit-chatbot/${docRef.id}`);
      } catch (error) {
        console.error("Error creating new chatbot:", error);
        setError("Failed to create new chatbot. Please try again.");
      }
    } else {
      setError("Please enter a name for the new chatbot.");
    }
  };

  const handleEditChatbot = (id: string) => {
    navigate(`/edit-chatbot/${id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chatbot Configurator</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Your Chatbots</h2>
        {chatbots.map((chatbot) => (
          <div
            key={chatbot.id}
            className="flex justify-between items-center mb-2 p-2 border rounded"
          >
            <span>{chatbot.name}</span>
            <button
              className="bg-blue-500 text-white p-2 rounded"
              onClick={() => handleEditChatbot(chatbot.id)}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Create New Chatbot</h2>
        <div className="flex">
          <input
            className="flex-grow p-2 border rounded-l"
            placeholder="New Chatbot Name"
            value={newChatbotName}
            onChange={(e) => setNewChatbotName(e.target.value)}
          />
          <button
            className="bg-green-500 text-white p-2 rounded-r"
            onClick={createNewChatbot}
          >
            Create
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default ChatbotConfigurator;
