import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../me/me_repository.dart';
import '../../auth/auth_repository.dart';
import '../../transactions/screens/transactions_screen.dart';
import '../../../core/app_info.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _editName(BuildContext context, WidgetRef ref, String currentName) async {
    final controller = TextEditingController(text: currentName);
    final newName = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit name'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Full name'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (newName == null || newName.isEmpty || newName == currentName) return;

    try {
      await ref.read(meRepositoryProvider).updateFullName(newName);
      ref.invalidate(meProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not update name. Please try again.')));
      }
    }
  }

  Future<void> _contactSupport(BuildContext context) async {
    final uri = Uri(scheme: 'mailto', path: supportEmail, queryParameters: {'subject': 'VTU App support'});
    if (!await launchUrl(uri)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Email us at $supportEmail')));
      }
    }
  }

  void _showTermsPlaceholder(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Terms & Privacy Policy will be added once provided by the business')),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You will need to verify your phone number again to sign back in.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Log out'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await ref.read(authRepositoryProvider).logout();
    if (context.mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: me.when(
        data: (m) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    child: Text(
                      m.user.displayName.substring(0, 1).toUpperCase(),
                      style: const TextStyle(fontSize: 28),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(m.user.displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                      IconButton(
                        icon: const Icon(Icons.edit, size: 18),
                        onPressed: () => _editName(context, ref, m.user.fullName ?? ''),
                      ),
                    ],
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(m.user.phone, style: TextStyle(color: Colors.grey.shade600)),
                      const SizedBox(width: 6),
                      Icon(Icons.verified, size: 16, color: Colors.green.shade600),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const _SectionHeader('Account'),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.account_balance_outlined),
                    title: const Text('Linked bank account'),
                    subtitle: Text(
                      m.wallet.virtualAccountNumber != null
                          ? '${m.wallet.virtualAccountNumber} • ${m.wallet.virtualAccountBankName ?? ''}'
                          : 'Not set up yet — fund your wallet to get started',
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.receipt_long_outlined),
                    title: const Text('Transaction history'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const TransactionsScreen()),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const _SectionHeader('Support'),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.support_agent_outlined),
                    title: const Text('Contact support'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _contactSupport(context),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.description_outlined),
                    title: const Text('Terms & Privacy Policy'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _showTermsPlaceholder(context),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const _SectionHeader('About'),
            Card(
              child: ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text('App version'),
                trailing: Text(appVersion, style: TextStyle(color: Colors.grey.shade600)),
              ),
            ),
            const SizedBox(height: 24),
            Card(
              child: ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Log out', style: TextStyle(color: Colors.red)),
                onTap: () => _confirmLogout(context, ref),
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(child: Text('Could not load profile')),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label,
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey.shade600),
      ),
    );
  }
}
