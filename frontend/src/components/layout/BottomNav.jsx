import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/log', icon: Dumbbell, label: 'Log' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
];

export default function BottomNav() {
  const location = useLocation();
  const activeTab = tabs.find(t =>
    t.to === '/' ? location.pathname === '/' : location.pathname.startsWith(t.to)
  )?.to;

  return (
    <nav
      className="relative z-30 flex-shrink-0 border-t border-[var(--color-border)]"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 bg-[var(--color-surface)]">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = to === activeTab;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="relative flex flex-col items-center justify-center gap-1 w-full h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-[var(--color-primary)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className={`text-[11px] transition-colors ${isActive ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-secondary)]'}`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
