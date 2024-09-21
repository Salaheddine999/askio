import React from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  icon: Icon,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center px-4 py-2 text-md rounded-md shadow-sm focus:outline-nonetransition-colors duration-200 ${className}`}
      disabled={disabled}
    >
      {Icon && <Icon size={20} className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
