import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileMenu from './ProfileMenu';

export default function TopBar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="relative z-30 flex items-center justify-between h-14 px-4 flex-shrink-0">
      {/* App title */}
      <h1
        className="text-lg tracking-[0.12em] font-semibold text-[var(--color-text)]"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <span className="text-[var(--color-primary)]">GIM</span>
        <span className="text-[var(--color-text)]">LI</span>
      </h1>

      {/* Profile */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#d4872a] to-[#96501d] flex items-center justify-center text-[#fdf8f0] text-sm font-semibold">
              {(user?.displayName || user?.email || '?')[0].toUpperCase()}
            </div>
          )}
        </button>

        {menuOpen && (
          <ProfileMenu onClose={() => setMenuOpen(false)} />
        )}
      </div>

      {/* Bottom border with forge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-border)]">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 10%, var(--color-primary) 50%, transparent 90%)',
            opacity: 0.15,
          }}
        />
      </div>
    </header>
  );
}
