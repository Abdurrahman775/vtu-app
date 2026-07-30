import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../exam_pin_repository.dart';

class ExamPinScreen extends ConsumerStatefulWidget {
  const ExamPinScreen({super.key});

  @override
  ConsumerState<ExamPinScreen> createState() => _ExamPinScreenState();
}

class _ExamPinScreenState extends ConsumerState<ExamPinScreen> {
  String _examBody = examPinPricesByBody.keys.first;
  int _quantity = 1;
  bool _loading = false;
  String? _message;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await ref.read(examPinRepositoryProvider).purchase(
            examBody: _examBody,
            quantity: _quantity,
          );
      setState(() => _message = 'Exam pin purchase submitted');
    } catch (e) {
      setState(() => _message = 'Purchase failed. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final unitPrice = examPinPricesByBody[_examBody]!;
    final total = unitPrice * _quantity;

    return Scaffold(
      appBar: AppBar(title: const Text('WAEC / NECO Result Checker Pin')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              value: _examBody,
              items: examPinPricesByBody.keys
                  .map((body) => DropdownMenuItem(value: body, child: Text(body)))
                  .toList(),
              onChanged: (v) => setState(() => _examBody = v ?? _examBody),
              decoration: const InputDecoration(labelText: 'Exam body'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text('Quantity'),
                const Spacer(),
                IconButton(
                  onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                  icon: const Icon(Icons.remove_circle_outline),
                ),
                Text('$_quantity', style: const TextStyle(fontSize: 16)),
                IconButton(
                  onPressed: () => setState(() => _quantity++),
                  icon: const Icon(Icons.add_circle_outline),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text('Total: ₦${total.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
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
                  : const Text('Buy Pin'),
            ),
          ],
        ),
      ),
    );
  }
}
