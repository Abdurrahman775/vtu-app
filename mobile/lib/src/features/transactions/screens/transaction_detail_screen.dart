import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import '../transactions_repository.dart';
import '../../../core/pdf/pdf_builder.dart';
import '../../../core/widgets/provider_badge.dart';

const _reportReasons = [
  'Airtime/data not received',
  'Wrong amount charged',
  'Duplicate transaction',
  'Wallet not credited',
  'Other',
];

class TransactionDetailScreen extends ConsumerStatefulWidget {
  const TransactionDetailScreen({super.key, required this.transactionId});

  final String transactionId;

  @override
  ConsumerState<TransactionDetailScreen> createState() => _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends ConsumerState<TransactionDetailScreen> {
  bool _generatingReceipt = false;

  Future<void> _downloadReceipt(TransactionDetail t) async {
    setState(() => _generatingReceipt = true);
    try {
      final bytes = await buildReceiptPdf(t);
      await Printing.sharePdf(bytes: bytes, filename: 'receipt_${t.reference}.pdf');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not generate receipt. Please try again.')));
      }
    } finally {
      if (mounted) setState(() => _generatingReceipt = false);
    }
  }

  Future<void> _reportProblem(BuildContext context, WidgetRef ref) async {
    String selectedReason = _reportReasons.first;
    final messageController = TextEditingController();

    final submitted = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Report a problem'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<String>(
                value: selectedReason,
                items: _reportReasons
                    .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                    .toList(),
                onChanged: (v) => setState(() => selectedReason = v ?? selectedReason),
                decoration: const InputDecoration(labelText: 'Reason'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: messageController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Additional details (optional)',
                  alignLabelWithHint: true,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Submit')),
          ],
        ),
      ),
    );

    if (submitted != true || !context.mounted) return;

    try {
      await ref.read(transactionsRepositoryProvider).reportProblem(
            widget.transactionId,
            reason: selectedReason,
            message: messageController.text.trim(),
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Report submitted — our team will review it')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not submit report. Please try again.')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(transactionDetailProvider(widget.transactionId));
    final dateFormat = DateFormat('MMM d, y • h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('Transaction Details')),
      body: detail.when(
        data: (t) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ProviderBadge(code: t.provider, size: 40),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text('${t.type} — ${t.provider}',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(dateFormat.format(t.createdAt), style: TextStyle(color: Colors.grey.shade600)),
                    const Divider(height: 32),
                    _DetailRow('Amount', '₦${t.amountNaira.toStringAsFixed(2)}'),
                    _DetailRow('Status', t.status),
                    _DetailRow('Reference', t.reference),
                    if (t.providerReference != null)
                      _DetailRow('Provider reference', t.providerReference!),
                    if (t.meta?['phone'] != null) _DetailRow('Phone', t.meta!['phone'].toString()),
                    if (t.meta?['planCode'] != null) _DetailRow('Plan', t.meta!['planCode'].toString()),
                    if (t.meta?['smartCardNumber'] != null)
                      _DetailRow('Smart card', t.meta!['smartCardNumber'].toString()),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _generatingReceipt ? null : () => _downloadReceipt(t),
                icon: _generatingReceipt
                    ? const SizedBox(
                        height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.picture_as_pdf_outlined),
                label: Text(_generatingReceipt ? 'Generating…' : 'Download Receipt'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () => _reportProblem(context, ref),
                icon: const Icon(Icons.flag_outlined, color: Colors.red),
                label: const Text('Report a problem', style: TextStyle(color: Colors.red)),
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(child: Text('Could not load transaction')),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade600)),
          Flexible(
            child: Text(value, textAlign: TextAlign.end, style: const TextStyle(fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}
