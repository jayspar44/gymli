import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileMenu from './ProfileMenu';

export default function TopBar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [menuOpen]);

  const initial = user?.displayName?.[0] || user?.email?.[0] || '?';

  return (
    <header className="relative z-30 flex items-center justify-between h-14 px-4 flex-shrink-0 border-b border-[var(--color-border)]">
      <span className="text-lg font-bold text-[var(--color-text)] tracking-tight">Gymli</span>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary)] text-white text-sm font-semibold">
              {initial.toUpperCase()}
            </div>
          )}
        </button>
        {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      </div>
    </header>
  );
}
