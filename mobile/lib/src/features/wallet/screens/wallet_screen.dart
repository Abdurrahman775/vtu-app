import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../wallet_repository.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  final _amountController = TextEditingController();
  final _emailController = TextEditingController();
  bool _funding = false;

  Future<void> _fund() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0 || _emailController.text.isEmpty) return;

    setState(() => _funding = true);
    try {
      final url = await ref
          .read(walletRepositoryProvider)
          .fundWallet(amountNaira: amount, email: _emailController.text.trim());
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } finally {
      if (mounted) setState(() => _funding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final balance = ref.watch(walletBalanceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Wallet')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(walletBalanceProvider.future),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            balance.when(
              data: (b) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const Text('Wallet balance'),
                      const SizedBox(height: 8),
                      Text(
                        '₦${b.balanceNaira.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => const Text('Could not load balance'),
            ),
            const SizedBox(height: 32),
            const Text('Fund wallet', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email (for payment receipt)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₦)'),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _funding ? null : _fund,
              child: _funding
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Fund with Paystack'),
            ),
          ],
        ),
      ),
    );
  }
}
