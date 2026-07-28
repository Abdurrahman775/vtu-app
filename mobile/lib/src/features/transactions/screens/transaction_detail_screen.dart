import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../transactions_repository.dart';
import '../../../core/receipt_downloader.dart';

const _reportReasons = [
  'Airtime/data not received',
  'Wrong amount charged',
  'Duplicate transaction',
  'Wallet not credited',
  'Other',
];

class TransactionDetailScreen extends ConsumerWidget {
  const TransactionDetailScreen({super.key, required this.transactionId});

  final String transactionId;

  String _buildReceiptText(TransactionDetail t) {
    final dateFormat = DateFormat('MMM d, y • h:mm a');
    final buffer = StringBuffer()
      ..writeln('VTU App Receipt')
      ..writeln('========================')
      ..writeln('Reference: ${t.reference}')
      ..writeln('Type: ${t.type}')
      ..writeln('Provider: ${t.provider}')
      ..writeln('Amount: ₦${t.amountNaira.toStringAsFixed(2)}')
      ..writeln('Status: ${t.status}')
      ..writeln('Date: ${dateFormat.format(t.createdAt)}');
    if (t.providerReference != null) {
      buffer.writeln('Provider reference: ${t.providerReference}');
    }
    return buffer.toString();
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
            transactionId,
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
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(transactionDetailProvider(transactionId));
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
                    Text('${t.type} — ${t.provider}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
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
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Share.share(_buildReceiptText(t)),
                    icon: const Icon(Icons.share_outlined),
                    label: const Text('Share'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      downloadReceiptAsFile('receipt_${t.reference}.txt', _buildReceiptText(t));
                      ScaffoldMessenger.of(context)
                          .showSnackBar(const SnackBar(content: Text('Receipt downloaded')));
                    },
                    icon: const Icon(Icons.download_outlined),
                    label: const Text('Save'),
                  ),
                ),
              ],
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
