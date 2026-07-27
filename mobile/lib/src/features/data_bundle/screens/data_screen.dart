import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data_repository.dart';

class DataScreen extends ConsumerStatefulWidget {
  const DataScreen({super.key});

  @override
  ConsumerState<DataScreen> createState() => _DataScreenState();
}

class _DataScreenState extends ConsumerState<DataScreen> {
  final _phoneController = TextEditingController();
  String _network = dataPlansByNetwork.keys.first;
  DataPlan? _plan;
  bool _loading = false;
  String? _message;

  Future<void> _submit() async {
    final plan = _plan;
    if (plan == null || _phoneController.text.isEmpty) return;

    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await ref.read(dataRepositoryProvider).purchase(
            network: _network,
            phone: _phoneController.text.trim(),
            plan: plan,
          );
      setState(() => _message = 'Data purchase submitted');
    } catch (e) {
      setState(() => _message = 'Purchase failed. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plans = dataPlansByNetwork[_network]!;

    return Scaffold(
      appBar: AppBar(title: const Text('Buy Data')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              initialValue: _network,
              items: dataPlansByNetwork.keys
                  .map((n) => DropdownMenuItem(value: n, child: Text(n)))
                  .toList(),
              onChanged: (v) => setState(() {
                _network = v ?? _network;
                _plan = null;
              }),
              decoration: const InputDecoration(labelText: 'Network'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone number'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<DataPlan>(
              initialValue: _plan,
              items: plans
                  .map((p) => DropdownMenuItem(
                        value: p,
                        child: Text('${p.label} — ₦${p.priceNaira.toStringAsFixed(0)}'),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _plan = v),
              decoration: const InputDecoration(labelText: 'Plan'),
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
                  : const Text('Buy data'),
            ),
          ],
        ),
      ),
    );
  }
}
