import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class DataPlan {
  const DataPlan({required this.code, required this.label, required this.priceNaira});

  final String code;
  final String label;
  final double priceNaira;
}

/// Placeholder catalogue until the chosen VTU provider's live plan list is wired up.
const dataPlansByNetwork = <String, List<DataPlan>>{
  'MTN': [
    DataPlan(code: 'mtn-1gb-30d', label: '1GB - 30 days', priceNaira: 500),
    DataPlan(code: 'mtn-2gb-30d', label: '2GB - 30 days', priceNaira: 1000),
  ],
  'AIRTEL': [
    DataPlan(code: 'airtel-1gb-30d', label: '1GB - 30 days', priceNaira: 500),
    DataPlan(code: 'airtel-2gb-30d', label: '2GB - 30 days', priceNaira: 1000),
  ],
  'GLO': [
    DataPlan(code: 'glo-1.5gb-30d', label: '1.5GB - 30 days', priceNaira: 500),
  ],
  '9MOBILE': [
    DataPlan(code: '9mobile-1gb-30d', label: '1GB - 30 days', priceNaira: 500),
  ],
};

class DataRepository {
  DataRepository(this._api);

  final ApiClient _api;

  Future<void> purchase({
    required String network,
    required String phone,
    required DataPlan plan,
  }) async {
    await _api.dio.post(Endpoints.dataPurchase, data: {
      'network': network,
      'phone': phone,
      'planCode': plan.code,
      'amountNaira': plan.priceNaira,
    });
  }
}

final dataRepositoryProvider = Provider<DataRepository>((ref) {
  return DataRepository(ApiClient.instance);
});
