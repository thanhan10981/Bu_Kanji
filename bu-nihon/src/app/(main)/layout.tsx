import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SettingsModal } from "@/components/layout/SettingsModal";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <Header />
      <SettingsModal />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}
