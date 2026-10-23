import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[#101723] dark:text-[#D7DFE5] mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full p-2 border border-[#D8DFE9] dark:border-[#2B3646] rounded-md text-[#101723] dark:text-[#D7DFE5] bg-[#F9FCFF] dark:bg-[#1A2533] focus:ring-[#101723] dark:focus:ring-[#D7DFE5] focus:border-[#101723] dark:focus:border-[#D7DFE5] focus:outline-none placeholder:text-[#647184] dark:placeholder:text-[#87909D] ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
