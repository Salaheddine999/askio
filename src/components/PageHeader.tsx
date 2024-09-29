import React from "react";
import { Menu } from "lucide-react";
import Button from "./Button";

interface PageHeaderProps {
  title: string;
  toggleSidebar: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, toggleSidebar }) => {
  return (
    <header className="mb-8 sm:mb-12 flex justify-between items-center">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
