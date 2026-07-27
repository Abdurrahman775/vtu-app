import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class TransferRepository {
  TransferRepository(this._api);

  final ApiClient _api;

  Future<void> transfer({required String toPhone, required double amountNaira}) async {
    await _api.dio.post(Endpoints.walletTransfer, data: {
      'toPhone': toPhone,
      'amountNaira': amountNaira,
    });
  }
}

final transferRepositoryProvider = Provider<TransferRepository>((ref) {
  return TransferRepository(ApiClient.instance);
});
