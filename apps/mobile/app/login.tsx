import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (msg.toLowerCase().includes('cancel')) return; // user dismissed — not an error
      setErr(msg || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-1 justify-center gap-3 px-6">
        <Text className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Gymli</Text>
        <TextInput
          className="rounded-xl bg-surface-alt px-4 min-h-12 text-base dark:bg-surface-dark dark:text-zinc-50"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="rounded-xl bg-surface-alt px-4 min-h-12 text-base dark:bg-surface-dark dark:text-zinc-50"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {err ? <Text className="text-base text-red-500">{err}</Text> : null}
        <Pressable
          className="rounded-xl bg-primary min-h-14 items-center justify-center"
          onPress={() =>
            run(() =>
              mode === 'in'
                ? signInWithEmail(email, password)
                : signUpWithEmail(email, password)
            )
          }
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              {mode === 'in' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </Pressable>
        <Pressable
          className="rounded-xl border border-zinc-300 min-h-14 items-center justify-center dark:border-zinc-700"
          onPress={() => run(signInWithGoogle)}
        >
          <Text className="text-center text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Continue with Google
          </Text>
        </Pressable>
        <Pressable className="min-h-10 items-center justify-center" onPress={() => setMode(mode === 'in' ? 'up' : 'in')}>
          <Text className="text-center text-sm text-zinc-500">
            {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
