import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import '../../me/me_repository.dart';
import '../../transactions/transactions_repository.dart';
import '../../../core/pdf/pdf_builder.dart';

/// Matches the backend's cap in web/src/app/api/transactions/route.ts —
/// a statement can't start earlier than this many months back.
const _maxMonthsBack = 3;

DateTime _earliestAllowedStart() {
  final now = DateTime.now();
  return DateTime(now.year, now.month - _maxMonthsBack, now.day);
}

class StatementScreen extends ConsumerStatefulWidget {
  const StatementScreen({super.key});

  @override
  ConsumerState<StatementScreen> createState() => _StatementScreenState();
}

class _StatementScreenState extends ConsumerState<StatementScreen> {
  late DateTimeRange _range;
  bool _generating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final earliestStart = _earliestAllowedStart();
    final defaultStart = now.subtract(const Duration(days: 30));
    _range = DateTimeRange(
      start: defaultStart.isBefore(earliestStart) ? earliestStart : defaultStart,
      end: now,
    );
  }

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: _earliestAllowedStart(),
      lastDate: now,
      initialDateRange: _range,
      helpText: 'Statement period (up to 3 months back)',
    );
    if (picked != null) setState(() => _range = picked);
  }

  Future<void> _generate() async {
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final transactions = await ref.read(transactionsRepositoryProvider).listByRange(
            from: _range.start,
            to: _range.end,
          );
      final me = await ref.read(meRepositoryProvider).getMe();
      final bytes = await buildStatementPdf(
        transactions: transactions,
        from: _range.start,
        to: _range.end,
        accountLabel: me.user.displayName,
      );
      final filename =
          'statement_${DateFormat('yyyyMMdd').format(_range.start)}_${DateFormat('yyyyMMdd').format(_range.end)}.pdf';
      await Printing.sharePdf(bytes: bytes, filename: filename);
    } catch (e) {
      setState(() => _error = 'Could not generate statement. Please try again.');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, y');

    return Scaffold(
      appBar: AppBar(title: const Text('Account Statement')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Generate a PDF statement of your transactions for a custom period, up to 3 months back.',
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: _pickRange,
              icon: const Icon(Icons.date_range_outlined),
              label: Text('${dateFormat.format(_range.start)} — ${dateFormat.format(_range.end)}'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _generating ? null : _generate,
              icon: _generating
                  ? const SizedBox(
                      height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.picture_as_pdf_outlined),
              label: Text(_generating ? 'Generating…' : 'Generate Statement'),
            ),
          ],
        ),
      ),
    );
  }
}
