import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../transfer_repository.dart';
import '../../me/me_repository.dart';
import '../../../core/widgets/pin_prompt.dart';

class TransferScreen extends ConsumerStatefulWidget {
  const TransferScreen({super.key});

  @override
  ConsumerState<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends ConsumerState<TransferScreen> {
  final _phoneController = TextEditingController();
  final _amountController = TextEditingController();
  bool _loading = false;
  String? _message;
  bool _success = false;

  Future<void> _submit() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0 || _phoneController.text.isEmpty) return;

    final hasPin = ref.read(meProvider).value?.user.hasPin ?? false;
    String? pin;
    if (hasPin) {
      pin = await promptForTransactionPin(context);
      if (pin == null || !mounted) return;
    }

    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await ref.read(transferRepositoryProvider).transfer(
            toPhone: _phoneController.text.trim(),
            amountNaira: amount,
            pin: pin,
          );
      setState(() {
        _success = true;
        _message = 'Transfer successful';
      });
      _phoneController.clear();
      _amountController.clear();
      ref.invalidate(meProvider);
    } on DioException catch (e) {
      setState(() {
        _success = false;
        _message = e.response?.data?['error'] as String? ?? 'Transfer failed';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(meProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Transfer')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            me.maybeWhen(
              data: (m) => Text(
                'Available balance: ₦${m.wallet.balanceNaira.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              orElse: () => const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: "Recipient's phone number"),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₦)'),
            ),
            if (_message != null) ...[
              const SizedBox(height: 8),
              Text(_message!, style: TextStyle(color: _success ? Colors.green : Colors.red)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Send'),
            ),
          ],
        ),
      ),
    );
  }
}
