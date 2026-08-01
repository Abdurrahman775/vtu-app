import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../me/me_repository.dart';

/// Read-only summary of the signed-in account — email/phone plus the
/// wallet's funding details. There's no separate "linked accounts"
/// concept in this app's data model, so this is just everything
/// `GET /api/me` already returns, laid out as its own screen.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: me.when(
        data: (m) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.email_outlined),
                    title: const Text('Email'),
                    subtitle: Text(m.user.email),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.phone_outlined),
                    title: const Text('Phone number'),
                    subtitle: Text(m.user.phone ?? 'Not set'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.account_balance_wallet_outlined),
                    title: const Text('Wallet balance'),
                    subtitle: Text('₦${m.wallet.balanceNaira.toStringAsFixed(2)}'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.account_balance_outlined),
                    title: const Text('Virtual account'),
                    subtitle: Text(
                      m.wallet.virtualAccountNumber != null
                          ? '${m.wallet.virtualAccountNumber} • ${m.wallet.virtualAccountBankName ?? ''}'
                          : 'Not set up yet — fund your wallet to get started',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(child: Text('Could not load account details')),
      ),
    );
  }
}
