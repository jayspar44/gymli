import { Outlet } from 'react-router-dom';
import MobileContainer from './MobileContainer';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <MobileContainer>
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </MobileContainer>
  );
}
