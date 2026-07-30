import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

/// Placeholder per-pin price until the real VTU provider's live pricing is wired up.
const examPinPricesByBody = <String, double>{
  'WAEC': 3200,
  'NECO': 1200,
};

class ExamPinRepository {
  ExamPinRepository(this._api);

  final ApiClient _api;

  Future<void> purchase({
    required String examBody,
    required int quantity,
    String? pin,
  }) async {
    final unitPrice = examPinPricesByBody[examBody]!;
    await _api.dio.post(Endpoints.examPinPurchase, data: {
      'examBody': examBody,
      'quantity': quantity,
      'amountNaira': unitPrice * quantity,
      if (pin != null) 'pin': pin,
    });
  }
}

final examPinRepositoryProvider = Provider<ExamPinRepository>((ref) {
  return ExamPinRepository(ApiClient.instance);
});
