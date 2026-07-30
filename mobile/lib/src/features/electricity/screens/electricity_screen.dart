import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../electricity_repository.dart';
import '../../../core/widgets/provider_badge.dart';
import '../../../core/widgets/pin_prompt.dart';
import '../../me/me_repository.dart';

const _meterTypes = ['PREPAID', 'POSTPAID'];

class ElectricityScreen extends ConsumerStatefulWidget {
  const ElectricityScreen({super.key});

  @override
  ConsumerState<ElectricityScreen> createState() => _ElectricityScreenState();
}

class _ElectricityScreenState extends ConsumerState<ElectricityScreen> {
  final _meterController = TextEditingController();
  final _amountController = TextEditingController();
  String _disco = discos.first;
  String _meterType = _meterTypes.first;
  bool _verifying = false;
  bool _purchasing = false;
  String? _message;
  MeterVerification? _verified;

  Future<void> _verifyMeter() async {
    if (_meterController.text.trim().isEmpty) return;

    setState(() {
      _verifying = true;
      _message = null;
      _verified = null;
    });
    try {
      final result = await ref.read(electricityRepositoryProvider).verifyMeter(
            disco: _disco,
            meterNumber: _meterController.text.trim(),
            meterType: _meterType,
          );
      setState(() => _verified = result);
    } catch (e) {
      setState(() => _message = 'Could not verify meter. Please check the details.');
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0 || _verified == null) return;

    final hasPin = ref.read(meProvider).value?.user.hasPin ?? false;
    String? pin;
    if (hasPin) {
      pin = await promptForTransactionPin(context);
      if (pin == null || !mounted) return;
    }

    setState(() {
      _purchasing = true;
      _message = null;
    });
    try {
      await ref.read(electricityRepositoryProvider).purchase(
            disco: _disco,
            meterNumber: _meterController.text.trim(),
            meterType: _meterType,
            amountNaira: amount,
            pin: pin,
          );
      setState(() => _message = 'Electricity purchase submitted');
    } catch (e) {
      setState(() => _message = 'Purchase failed. Please try again.');
    } finally {
      if (mounted) setState(() => _purchasing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Electricity Bill')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              value: _disco,
              items: discos
                  .map((d) => DropdownMenuItem(
                        value: d,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ProviderBadge(code: d, size: 24),
                            const SizedBox(width: 10),
                            Text(d),
                          ],
                        ),
                      ))
                  .toList(),
              selectedItemBuilder: (context) => discos
                  .map((d) => Row(
                        children: [
                          ProviderBadge(code: d, size: 20),
                          const SizedBox(width: 8),
                          Text(d),
                        ],
                      ))
                  .toList(),
              onChanged: (v) => setState(() {
                _disco = v ?? _disco;
                _verified = null;
              }),
              decoration: const InputDecoration(labelText: 'Disco'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _meterType,
              items: _meterTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) => setState(() {
                _meterType = v ?? _meterType;
                _verified = null;
              }),
              decoration: const InputDecoration(labelText: 'Meter type'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _meterController,
              keyboardType: TextInputType.number,
              onChanged: (_) => setState(() => _verified = null),
              decoration: const InputDecoration(labelText: 'Meter number'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _verifying ? null : _verifyMeter,
              child: _verifying
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Verify meter'),
            ),
            if (_verified != null) ...[
              const SizedBox(height: 12),
              Text('Meter verified: ${_verified!.customerName}',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(_verified!.address, style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 12),
              TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (₦)'),
              ),
            ],
            if (_message != null) ...[
              const SizedBox(height: 8),
              Text(_message!),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: (_verified == null || _purchasing) ? null : _submit,
              child: _purchasing
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Pay bill'),
            ),
          ],
        ),
      ),
    );
  }
}
