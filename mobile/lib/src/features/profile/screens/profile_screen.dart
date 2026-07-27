import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../me/me_repository.dart';
import '../../auth/auth_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: me.when(
        data: (m) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            CircleAvatar(
              radius: 40,
              child: Text(
                m.user.displayName.substring(0, 1).toUpperCase(),
                style: const TextStyle(fontSize: 28),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: Text(m.user.displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            ),
            Center(child: Text(m.user.phone)),
            const SizedBox(height: 32),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Log out'),
              onTap: () async {
                await ref.read(authRepositoryProvider).logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(child: Text('Could not load profile')),
      ),
    );
  }
}
