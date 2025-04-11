export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 md:py-16 max-w-7xl mx-auto min-h-dvh">{children}</div>
  );
}
