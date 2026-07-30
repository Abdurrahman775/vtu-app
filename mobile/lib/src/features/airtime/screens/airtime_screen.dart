import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../airtime_repository.dart';
import '../../../core/widgets/provider_badge.dart';
import '../../../core/widgets/pin_prompt.dart';
import '../../me/me_repository.dart';

const _networks = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

class AirtimeScreen extends ConsumerStatefulWidget {
  const AirtimeScreen({super.key});

  @override
  ConsumerState<AirtimeScreen> createState() => _AirtimeScreenState();
}

class _AirtimeScreenState extends ConsumerState<AirtimeScreen> {
  final _phoneController = TextEditingController();
  final _amountController = TextEditingController();
  String _network = _networks.first;
  bool _loading = false;
  String? _message;

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
      await ref.read(airtimeRepositoryProvider).purchase(
            network: _network,
            phone: _phoneController.text.trim(),
            amountNaira: amount,
            pin: pin,
          );
      setState(() => _message = 'Airtime purchase submitted');
    } catch (e) {
      setState(() => _message = 'Purchase failed. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buy Airtime')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              value: _network,
              items: _networks
                  .map((n) => DropdownMenuItem(
                        value: n,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ProviderBadge(code: n, size: 24),
                            const SizedBox(width: 10),
                            Text(n),
                          ],
                        ),
                      ))
                  .toList(),
              selectedItemBuilder: (context) => _networks
                  .map((n) => Row(
                        children: [
                          ProviderBadge(code: n, size: 20),
                          const SizedBox(width: 8),
                          Text(n),
                        ],
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _network = v ?? _network),
              decoration: const InputDecoration(labelText: 'Network'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₦)'),
            ),
            if (_message != null) ...[
              const SizedBox(height: 8),
              Text(_message!),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Buy airtime'),
            ),
          ],
        ),
      ),
    );
  }
}
