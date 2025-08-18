import Chat from "@/components/Chat";
import AuthGuard from "@/components/AuthGuard";
import React from "react";

const Page = () => {
  return (
    <AuthGuard>
      <Chat />
    </AuthGuard>
  );
};

export default Page;
