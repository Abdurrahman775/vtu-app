import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class AirtimeRepository {
  AirtimeRepository(this._api);

  final ApiClient _api;

  Future<void> purchase({
    required String network,
    required String phone,
    required double amountNaira,
  }) async {
    await _api.dio.post(Endpoints.airtimePurchase, data: {
      'network': network,
      'phone': phone,
      'amountNaira': amountNaira,
    });
  }
}

final airtimeRepositoryProvider = Provider<AirtimeRepository>((ref) {
  return AirtimeRepository(ApiClient.instance);
});
