export default function MobileContainer({ children }) {
  return (
    <div
      className="relative flex flex-col w-full min-h-screen max-w-lg mx-auto bg-[var(--color-bg)]"
      style={{
        paddingTop: 'var(--safe-area-top)',
        paddingBottom: 'var(--safe-area-bottom)',
        paddingLeft: 'var(--safe-area-left)',
        paddingRight: 'var(--safe-area-right)',
      }}
    >
      {children}
    </div>
  );
}
