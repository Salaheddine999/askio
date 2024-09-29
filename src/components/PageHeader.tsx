import React from "react";
import { Helmet } from "react-helmet-async";

interface PageHeaderProps {
  title: string;
  toggleSidebar: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, toggleSidebar }) => {
  return (
    <>
      <Helmet>
        <title>{title} | Askio</title>
      </Helmet>
    </>
  );
};

export default PageHeader;
