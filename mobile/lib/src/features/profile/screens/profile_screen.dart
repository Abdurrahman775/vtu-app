import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../me/me_repository.dart';
import '../../auth/auth_repository.dart';
import '../../transactions/screens/transactions_screen.dart';
import '../../../core/app_info.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _uploadingAvatar = false;

  Future<void> _pickAndUploadAvatar() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 800);
    if (picked == null) return;

    setState(() => _uploadingAvatar = true);
    try {
      await ref.read(meRepositoryProvider).uploadAvatar(picked);
      ref.invalidate(meProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not upload photo. Please try again.')));
      }
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  Future<void> _editName(String currentName) async {
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
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not update name. Please try again.')));
      }
    }
  }

  Future<void> _requestVerification() async {
    final controller = TextEditingController();
    final submitted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Request verification'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('An admin will review your account and confirm your identity.'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Note (optional)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Submit')),
        ],
      ),
    );

    if (submitted != true) return;

    try {
      await ref.read(meRepositoryProvider).requestVerification(note: controller.text.trim());
      ref.invalidate(meProvider);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Verification request submitted')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not submit request. Please try again.')));
      }
    }
  }

  Future<void> _contactSupport() async {
    final uri = Uri(scheme: 'mailto', path: supportEmail, queryParameters: {'subject': 'VTU App support'});
    if (!await launchUrl(uri)) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Email us at $supportEmail')));
      }
    }
  }

  void _showTermsPlaceholder() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Terms & Privacy Policy will be added once provided by the business')),
    );
  }

  Future<void> _confirmLogout() async {
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
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
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
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundImage: m.user.avatarFullUrl != null
                            ? NetworkImage(m.user.avatarFullUrl!)
                            : null,
                        child: m.user.avatarFullUrl == null
                            ? Text(
                                m.user.displayName.substring(0, 1).toUpperCase(),
                                style: const TextStyle(fontSize: 28),
                              )
                            : null,
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: InkWell(
                          onTap: _uploadingAvatar ? null : _pickAndUploadAvatar,
                          child: CircleAvatar(
                            radius: 14,
                            backgroundColor: Theme.of(context).colorScheme.primary,
                            child: _uploadingAvatar
                                ? const Padding(
                                    padding: EdgeInsets.all(3),
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(m.user.displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                      if (m.user.isVerified) ...[
                        const SizedBox(width: 4),
                        Icon(Icons.verified, size: 18, color: Colors.blue.shade600),
                      ],
                      IconButton(
                        icon: const Icon(Icons.edit, size: 18),
                        onPressed: () => _editName(m.user.fullName ?? ''),
                      ),
                    ],
                  ),
                  Text(m.user.phone, style: TextStyle(color: Colors.grey.shade600)),
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
                  const Divider(height: 1),
                  _VerificationTile(user: m.user, onRequest: _requestVerification),
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
                    onTap: _contactSupport,
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.description_outlined),
                    title: const Text('Terms & Privacy Policy'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: _showTermsPlaceholder,
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
                onTap: _confirmLogout,
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

class _VerificationTile extends StatelessWidget {
  const _VerificationTile({required this.user, required this.onRequest});

  final MeUser user;
  final VoidCallback onRequest;

  @override
  Widget build(BuildContext context) {
    if (user.isVerified) {
      return ListTile(
        leading: Icon(Icons.verified, color: Colors.blue.shade600),
        title: const Text('Identity verification'),
        subtitle: const Text('Verified'),
      );
    }

    if (user.latestVerificationRequestStatus == 'PENDING') {
      return const ListTile(
        leading: Icon(Icons.hourglass_top_outlined),
        title: Text('Identity verification'),
        subtitle: Text('Pending review'),
      );
    }

    final wasRejected = user.latestVerificationRequestStatus == 'REJECTED';
    return ListTile(
      leading: const Icon(Icons.shield_outlined),
      title: const Text('Identity verification'),
      subtitle: Text(wasRejected ? 'Not approved — tap to request again' : 'Not verified'),
      trailing: const Icon(Icons.chevron_right),
      onTap: onRequest,
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
