import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../me/me_repository.dart';
import '../../../core/theme/theme_mode_provider.dart';
import '../../../core/wallet_visibility_provider.dart';
import 'change_pin_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  void _comingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$feature is coming soon')),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);
    final balanceHidden = ref.watch(balanceHiddenProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.devices_outlined),
                  title: const Text('Manage Devices'),
                  subtitle: const Text('Control which devices have access to your account'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _comingSoon(context, 'Manage devices'),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.visibility_off_outlined),
                  title: const Text('Hide Balance'),
                  subtitle: const Text('Hide your balance on the home screen'),
                  value: balanceHidden,
                  onChanged: (v) => ref.read(balanceHiddenProvider.notifier).setHidden(v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.lock_clock_outlined),
                  title: const Text('Enable Security Lock'),
                  subtitle: const Text('Require your PIN when you close the app'),
                  value: false,
                  onChanged: (_) => _comingSoon(context, 'Security lock'),
                ),
                const Divider(height: 1),
                me.maybeWhen(
                  data: (m) => ListTile(
                    leading: Icon(m.user.hasPin ? Icons.pin_outlined : Icons.lock_open_outlined),
                    title: const Text('Transaction PIN'),
                    subtitle: Text(m.user.hasPin
                        ? 'Required before each transaction'
                        : 'Not set — tap to set one'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ChangePinScreen(hasPin: m.user.hasPin, email: m.user.email),
                      ),
                    ),
                  ),
                  orElse: () => const SizedBox.shrink(),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.face_outlined),
                  title: const Text('Enable Face ID'),
                  subtitle: const Text('Use Face ID instead of PIN to unlock'),
                  value: false,
                  onChanged: (_) => _comingSoon(context, 'Face ID'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Appearance', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            child: SwitchListTile(
              secondary: Icon(isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined),
              title: const Text('Dark Mode'),
              subtitle: const Text('Tap to toggle theme'),
              value: isDark,
              onChanged: (v) => ref
                  .read(themeModeProvider.notifier)
                  .setThemeMode(v ? ThemeMode.dark : ThemeMode.light),
            ),
          ),
          const SizedBox(height: 20),
          const Text('Feedback', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              leading: const Icon(Icons.star_outline),
              title: const Text('Rate the App'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _comingSoon(context, 'App store rating'),
            ),
          ),
        ],
      ),
    );
  }
}
