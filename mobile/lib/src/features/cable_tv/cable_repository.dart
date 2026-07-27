import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class CablePlan {
  const CablePlan({required this.code, required this.label, required this.priceNaira});

  final String code;
  final String label;
  final double priceNaira;
}

/// Placeholder catalogue until the chosen VTU provider's live plan list is wired up.
const cablePlansByProvider = <String, List<CablePlan>>{
  'DSTV': [
    CablePlan(code: 'dstv-padi', label: 'DStv Padi', priceNaira: 4400),
    CablePlan(code: 'dstv-compact', label: 'DStv Compact', priceNaira: 19000),
  ],
  'GOTV': [
    CablePlan(code: 'gotv-jinja', label: 'GOtv Jinja', priceNaira: 3900),
    CablePlan(code: 'gotv-max', label: 'GOtv Max', priceNaira: 8500),
  ],
  'STARTIMES': [
    CablePlan(code: 'startimes-basic', label: 'StarTimes Basic', priceNaira: 3200),
  ],
};

class CableRepository {
  CableRepository(this._api);

  final ApiClient _api;

  Future<void> purchase({
    required String provider,
    required String smartCardNumber,
    required CablePlan plan,
  }) async {
    await _api.dio.post(Endpoints.cablePurchase, data: {
      'provider': provider,
      'smartCardNumber': smartCardNumber,
      'planCode': plan.code,
      'amountNaira': plan.priceNaira,
    });
  }
}

final cableRepositoryProvider = Provider<CableRepository>((ref) {
  return CableRepository(ApiClient.instance);
});
