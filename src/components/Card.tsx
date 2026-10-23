import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-[#F9FCFF] dark:bg-[#1A2533] rounded-lg shadow-md overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
