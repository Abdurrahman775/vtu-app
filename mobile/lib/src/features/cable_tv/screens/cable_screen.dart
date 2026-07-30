import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../cable_repository.dart';
import '../../../core/widgets/provider_badge.dart';
import '../../../core/widgets/pin_prompt.dart';
import '../../me/me_repository.dart';

class CableScreen extends ConsumerStatefulWidget {
  const CableScreen({super.key});

  @override
  ConsumerState<CableScreen> createState() => _CableScreenState();
}

class _CableScreenState extends ConsumerState<CableScreen> {
  final _smartCardController = TextEditingController();
  String _provider = cablePlansByProvider.keys.first;
  CablePlan? _plan;
  bool _loading = false;
  String? _message;

  Future<void> _submit() async {
    final plan = _plan;
    if (plan == null || _smartCardController.text.isEmpty) return;

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
      await ref.read(cableRepositoryProvider).purchase(
            provider: _provider,
            smartCardNumber: _smartCardController.text.trim(),
            plan: plan,
            pin: pin,
          );
      setState(() => _message = 'Cable subscription submitted');
    } catch (e) {
      setState(() => _message = 'Purchase failed. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plans = cablePlansByProvider[_provider]!;

    return Scaffold(
      appBar: AppBar(title: const Text('Cable TV Subscription')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              value: _provider,
              items: cablePlansByProvider.keys
                  .map((p) => DropdownMenuItem(
                        value: p,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ProviderBadge(code: p, size: 24),
                            const SizedBox(width: 10),
                            Text(p),
                          ],
                        ),
                      ))
                  .toList(),
              selectedItemBuilder: (context) => cablePlansByProvider.keys
                  .map((p) => Row(
                        children: [
                          ProviderBadge(code: p, size: 20),
                          const SizedBox(width: 8),
                          Text(p),
                        ],
                      ))
                  .toList(),
              onChanged: (v) => setState(() {
                _provider = v ?? _provider;
                _plan = null;
              }),
              decoration: const InputDecoration(labelText: 'Provider'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _smartCardController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Smart card / IUC number'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<CablePlan>(
              value: _plan,
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
                  : const Text('Subscribe'),
            ),
          ],
        ),
      ),
    );
  }
}
