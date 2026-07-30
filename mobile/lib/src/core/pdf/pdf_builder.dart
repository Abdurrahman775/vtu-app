import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../../features/transactions/transactions_repository.dart';

const _brandColor = PdfColor.fromInt(0xFF1D4ED8);

/// Meta keys that are internal pricing details, not meaningful to a
/// customer reading a receipt — everything else in `meta` is rendered
/// generically as a "Label: value" line.
const _hiddenMetaKeys = {'baseAmountNaira', 'marginPercent'};

String _titleCase(String camelCase) {
  final withSpaces = camelCase.replaceAllMapped(
    RegExp(r'([a-z0-9])([A-Z])'),
    (m) => '${m[1]} ${m[2]}',
  );
  return withSpaces[0].toUpperCase() + withSpaces.substring(1);
}

pw.Widget _pdfHeader(String title) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text('VTU App', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: _brandColor)),
      pw.SizedBox(height: 4),
      pw.Text(title, style: const pw.TextStyle(fontSize: 14, color: PdfColors.grey700)),
      pw.SizedBox(height: 16),
      pw.Divider(color: _brandColor, thickness: 1.5),
      pw.SizedBox(height: 16),
    ],
  );
}

pw.Widget _row(String label, String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(vertical: 4),
    child: pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(label, style: const pw.TextStyle(color: PdfColors.grey700)),
        pw.Text(value, style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
      ],
    ),
  );
}

/// Builds a single-transaction receipt as PDF bytes.
Future<Uint8List> buildReceiptPdf(TransactionDetail t) async {
  final doc = pw.Document();
  final dateFormat = DateFormat('MMM d, y • h:mm a');

  final metaRows = <pw.Widget>[];
  if (t.meta != null) {
    for (final entry in t.meta!.entries) {
      if (_hiddenMetaKeys.contains(entry.key) || entry.value == null) continue;
      metaRows.add(_row(_titleCase(entry.key), entry.value.toString()));
    }
  }

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          _pdfHeader('Transaction Receipt'),
          pw.Text('${t.type} — ${t.provider}',
              style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
          pw.Text(dateFormat.format(t.createdAt), style: const pw.TextStyle(color: PdfColors.grey700)),
          pw.SizedBox(height: 16),
          _row('Amount', '₦${t.amountNaira.toStringAsFixed(2)}'),
          _row('Status', t.status),
          _row('Reference', t.reference),
          if (t.providerReference != null) _row('Provider reference', t.providerReference!),
          ...metaRows,
          pw.SizedBox(height: 32),
          pw.Divider(),
          pw.Text(
            'Generated ${DateFormat('MMM d, y • h:mm a').format(DateTime.now())} — VTU App',
            style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey500),
          ),
        ],
      ),
    ),
  );

  return doc.save();
}

/// Builds a PDF account statement for [transactions] within [from]..[to].
Future<Uint8List> buildStatementPdf({
  required List<TransactionSummary> transactions,
  required DateTime from,
  required DateTime to,
  required String accountLabel,
}) async {
  final doc = pw.Document();
  final dateFormat = DateFormat('MMM d, y');
  final rangeFormat = DateFormat('MMM d, y');

  double totalCredit = 0;
  double totalDebit = 0;
  for (final t in transactions) {
    final isCredit = t.type == 'WALLET_FUNDING' || (t.type == 'TRANSFER' && t.amountNaira > 0);
    if (isCredit) {
      totalCredit += t.amountNaira;
    } else {
      totalDebit += t.amountNaira;
    }
  }

  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      build: (context) => [
        _pdfHeader('Account Statement'),
        _row('Account', accountLabel),
        _row('Period', '${rangeFormat.format(from)} — ${rangeFormat.format(to)}'),
        _row('Transactions', '${transactions.length}'),
        pw.SizedBox(height: 16),
        pw.TableHelper.fromTextArray(
          headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
          headerDecoration: const pw.BoxDecoration(color: _brandColor),
          cellStyle: const pw.TextStyle(fontSize: 9),
          cellAlignment: pw.Alignment.centerLeft,
          columnWidths: {
            0: const pw.FlexColumnWidth(1.4),
            1: const pw.FlexColumnWidth(1.4),
            2: const pw.FlexColumnWidth(1.6),
            3: const pw.FlexColumnWidth(1.8),
            4: const pw.FlexColumnWidth(1.1),
            5: const pw.FlexColumnWidth(1.2),
          },
          headers: ['Date', 'Type', 'Provider', 'Reference', 'Status', 'Amount (₦)'],
          data: transactions
              .map((t) => [
                    dateFormat.format(t.createdAt),
                    t.type,
                    t.provider,
                    t.reference,
                    t.status,
                    t.amountNaira.toStringAsFixed(2),
                  ])
              .toList(),
        ),
        pw.SizedBox(height: 24),
        pw.Divider(),
        _row('Total in', '₦${totalCredit.toStringAsFixed(2)}'),
        _row('Total out', '₦${totalDebit.toStringAsFixed(2)}'),
        pw.SizedBox(height: 32),
        pw.Text(
          'Generated ${DateFormat('MMM d, y • h:mm a').format(DateTime.now())} — VTU App',
          style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey500),
        ),
      ],
    ),
  );

  return doc.save();
}
