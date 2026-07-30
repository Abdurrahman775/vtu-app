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

class TransactionDetail {
  const TransactionDetail({
    required this.id,
    required this.type,
    required this.provider,
    required this.amountNaira,
    required this.status,
    required this.reference,
    required this.providerReference,
    required this.meta,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String provider;
  final double amountNaira;
  final String status;
  final String reference;
  final String? providerReference;
  final Map<String, dynamic>? meta;
  final DateTime createdAt;

  factory TransactionDetail.fromJson(Map<String, dynamic> json) => TransactionDetail(
        id: json['id'] as String,
        type: json['type'] as String,
        provider: json['provider'] as String,
        amountNaira: (json['amountNaira'] as num).toDouble(),
        status: json['status'] as String,
        reference: json['reference'] as String,
        providerReference: json['providerReference'] as String?,
        meta: json['meta'] as Map<String, dynamic>?,
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

  Future<TransactionDetail> getById(String id) async {
    final response = await _api.dio.get('${Endpoints.transactions}/$id');
    return TransactionDetail.fromJson(response.data['transaction'] as Map<String, dynamic>);
  }

  /// Used for the account statement — the backend rejects [from] values
  /// more than 3 months back (see `web/src/app/api/transactions/route.ts`).
  Future<List<TransactionSummary>> listByRange({required DateTime from, required DateTime to}) async {
    final response = await _api.dio.get(Endpoints.transactions, queryParameters: {
      'from': from.toUtc().toIso8601String(),
      'to': to.toUtc().toIso8601String(),
    });
    final items = response.data['transactions'] as List;
    return items
        .map((item) => TransactionSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> reportProblem(String id, {required String reason, String? message}) async {
    await _api.dio.post('${Endpoints.transactions}/$id/report', data: {
      'reason': reason,
      if (message != null && message.isNotEmpty) 'message': message,
    });
  }
}

final transactionsRepositoryProvider = Provider<TransactionsRepository>((ref) {
  return TransactionsRepository(ApiClient.instance);
});

final transactionsProvider = FutureProvider.autoDispose<List<TransactionSummary>>((ref) {
  return ref.read(transactionsRepositoryProvider).list();
});

final transactionDetailProvider =
    FutureProvider.autoDispose.family<TransactionDetail, String>((ref, id) {
  return ref.read(transactionsRepositoryProvider).getById(id);
});
