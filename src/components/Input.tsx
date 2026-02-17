import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[#37322F] dark:text-[#F5F5F4] mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full p-2 border border-[#E0DEDB] dark:border-[#44403C] rounded-md text-[#37322F] dark:text-[#F5F5F4] bg-white dark:bg-[#292524] focus:ring-[#37322F] dark:focus:ring-[#F5F5F4] focus:border-[#37322F] dark:focus:border-[#F5F5F4] focus:outline-none placeholder:text-[#9CA3AF] dark:placeholder:text-[#605A57] ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
