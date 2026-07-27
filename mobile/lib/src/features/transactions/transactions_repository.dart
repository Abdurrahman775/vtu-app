import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class TransactionSummary {
  const TransactionSummary({
    required this.id,
    required this.type,
    required this.provider,
    required this.amountNaira,
    required this.status,
    required this.reference,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String provider;
  final double amountNaira;
  final String status;
  final String reference;
  final DateTime createdAt;

  factory TransactionSummary.fromJson(Map<String, dynamic> json) => TransactionSummary(
        id: json['id'] as String,
        type: json['type'] as String,
        provider: json['provider'] as String,
        amountNaira: (json['amountNaira'] as num).toDouble(),
        status: json['status'] as String,
        reference: json['reference'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class TransactionsRepository {
  TransactionsRepository(this._api);

  final ApiClient _api;

  Future<List<TransactionSummary>> list() async {
    final response = await _api.dio.get(Endpoints.transactions);
    final items = response.data['transactions'] as List;
    return items
        .map((item) => TransactionSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}

final transactionsRepositoryProvider = Provider<TransactionsRepository>((ref) {
  return TransactionsRepository(ApiClient.instance);
});

final transactionsProvider = FutureProvider.autoDispose<List<TransactionSummary>>((ref) {
  return ref.read(transactionsRepositoryProvider).list();
});
