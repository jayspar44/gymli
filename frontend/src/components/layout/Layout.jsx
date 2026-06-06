import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MobileContainer from './MobileContainer';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import ChatFAB from '../chat/ChatFAB';

export default function Layout() {
  const location = useLocation();

  return (
    <MobileContainer>
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <ChatFAB />
    </MobileContainer>
  );
}
