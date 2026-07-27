import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../transactions_repository.dart';

class TransactionsScreen extends ConsumerWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(transactionsProvider);
    final dateFormat = DateFormat('MMM d, y • h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('Transaction History')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(transactionsProvider.future),
        child: transactions.when(
          data: (items) => items.isEmpty
              ? const Center(child: Text('No transactions yet'))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (context, index) {
                    final t = items[index];
                    return ListTile(
                      title: Text('${t.type} — ${t.provider}'),
                      subtitle: Text(dateFormat.format(t.createdAt)),
                      trailing: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('₦${t.amountNaira.toStringAsFixed(2)}'),
                          Text(t.status, style: TextStyle(color: _statusColor(t.status))),
                        ],
                      ),
                    );
                  },
                ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => const Center(child: Text('Could not load transactions')),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'SUCCESS':
        return Colors.green;
      case 'FAILED':
      case 'REVERSED':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }
}
