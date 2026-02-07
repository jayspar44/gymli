import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, BarChart3 } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/log', icon: Dumbbell, label: 'Log' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
];

export default function BottomNav() {
  return (
    <nav className="relative z-30 flex-shrink-0" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--color-border)]" />

      <div className="flex items-center justify-around h-16 bg-[var(--color-surface)]">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[var(--color-primary)]">
                    <div
                      className="absolute inset-0 rounded-b-full"
                      style={{
                        boxShadow: '0 2px 8px var(--color-primary)',
                        opacity: 0.5,
                      }}
                    />
                  </div>
                )}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-[11px] ${isActive ? 'font-medium' : 'font-normal'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
