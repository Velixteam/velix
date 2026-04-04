import { PageShell } from "../shared-layout";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
