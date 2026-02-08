import { useNavigate } from 'react-router-dom';
import { User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileMenu({ onClose }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleNav(path) {
    navigate(path);
    onClose();
  }

  async function handleSignOut() {
    await signOut();
    onClose();
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl shadow-black/20 overflow-hidden z-50">
      {/* User info */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <p className="text-sm font-medium text-[var(--color-text)] truncate">
          {user?.displayName || 'Warrior'}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
          {user?.email}
        </p>
      </div>

      {/* Links */}
      <div className="py-1">
        <button
          onClick={() => handleNav('/profile')}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <User className="w-4 h-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          Profile
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          )}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {/* Sign out */}
      <div className="border-t border-[var(--color-border)] py-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
