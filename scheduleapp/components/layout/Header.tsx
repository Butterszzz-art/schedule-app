export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center px-5 py-4">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
