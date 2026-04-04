import { PageShell } from "./shared-layout";

export const metadata = {
  title: "Velix - The Modern React Framework",
  description: "Build fast. Ship faster. Velix is a blazing-fast full-stack React framework with file-based routing, server actions, Islands architecture, and zero-config deployment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
