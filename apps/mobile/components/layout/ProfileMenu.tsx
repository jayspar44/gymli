/**
 * ProfileMenu — port of frontend/src/components/layout/ProfileMenu.jsx.
 *
 * A drop-down / action sheet showing user info, profile nav, theme toggle,
 * and sign-out. On mobile it renders as a bottom-sheet (no floating div).
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 */
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Sun, Moon } from 'lucide-react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfile } from '../../contexts/UserProfileContext';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ProfileMenu({ open, onClose }: Props) {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  function handleNav(path: string) {
    onClose();
    router.push(path as never);
  }

  async function handleSignOut() {
    onClose();
    await signOut();
  }

  const displayName =
    (profile as { displayName?: string } | null)?.displayName ??
    user?.displayName ??
    'Athlete';

  return (
    <BottomSheet open={open} onClose={onClose} snapPoints={['35%']}>
      {/* User info */}
      <View className="pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-700">
        <Text
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          numberOfLines={1}
        >
          {displayName}
        </Text>
        {user?.email ? (
          <Text className="text-xs text-zinc-500 mt-0.5" numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}
      </View>

      {/* Links */}
      <View className="gap-1">
        <Pressable
          onPress={() => handleNav('/profile')}
          className="flex-row items-center gap-3 px-1 py-2.5 rounded-lg active:bg-surface-alt dark:active:bg-surface-dark"
        >
          <User size={16} color="#71717a" strokeWidth={1.5} />
          <Text className="text-sm text-zinc-900 dark:text-zinc-50">Profile</Text>
        </Pressable>

        {/* Theme toggle */}
        <Pressable
          onPress={toggleTheme}
          className="flex-row items-center gap-3 px-1 py-2.5 rounded-lg active:bg-surface-alt dark:active:bg-surface-dark"
        >
          {theme === 'dark' ? (
            <Sun size={16} color="#71717a" strokeWidth={1.5} />
          ) : (
            <Moon size={16} color="#71717a" strokeWidth={1.5} />
          )}
          <Text className="text-sm text-zinc-900 dark:text-zinc-50">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </Pressable>
      </View>

      {/* Sign out */}
      <View className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-700">
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center gap-3 px-1 py-2.5 rounded-lg active:bg-surface-alt dark:active:bg-surface-dark"
        >
          <LogOut size={16} color="#ef4444" strokeWidth={1.5} />
          <Text className="text-sm text-red-500">Sign Out</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

export default ProfileMenu;
