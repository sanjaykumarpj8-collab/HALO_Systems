import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import GlobalListener from "../components/GlobalListener";
import { Toaster } from "react-hot-toast";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dashboardLayout}>
      <Toaster position="top-right" />
      <GlobalListener />
      <Sidebar />
      <div className={styles.mainArea}>
        <Header />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
