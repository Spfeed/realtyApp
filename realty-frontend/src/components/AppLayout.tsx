import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import {useLocation } from "react-router";

type Props = {
  children: ReactNode;
};

export function AppLayout({ children }: Props) {
  const location = useLocation();
  const isChatsPage = location.pathname.startsWith("/chats");

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-content">{children}</div>

      {!isChatsPage && <Footer />}
    </div>
  );
}