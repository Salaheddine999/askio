import React, { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackDisplayProps {
  chatbotId: string;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ chatbotId }) => {
  const [positiveFeedback, setPositiveFeedback] = useState(0);
  const [negativeFeedback, setNegativeFeedback] = useState(0);

  useEffect(() => {
    const fetchFeedback = async () => {
      const feedbackRef = collection(db, "feedback");
      const positiveQuery = query(
        feedbackRef,
        where("chatbotId", "==", chatbotId),
        where("isPositive", "==", true)
      );
      const negativeQuery = query(
        feedbackRef,
        where("chatbotId", "==", chatbotId),
        where("isPositive", "==", false)
      );

      const positiveSnapshot = await getDocs(positiveQuery);
      const negativeSnapshot = await getDocs(negativeQuery);

      setPositiveFeedback(positiveSnapshot.size);
      setNegativeFeedback(negativeSnapshot.size);
    };

    fetchFeedback();
  }, [chatbotId]);

  return (
    <div className="flex items-center space-x-4 mt-2">
      <div className="flex items-center">
        <ThumbsUp size={16} className="text-green-500 mr-1" />
        <span>{positiveFeedback}</span>
      </div>
      <div className="flex items-center">
        <ThumbsDown size={16} className="text-red-500 mr-1" />
        <span>{negativeFeedback}</span>
      </div>
    </div>
  );
};

export default FeedbackDisplay;
