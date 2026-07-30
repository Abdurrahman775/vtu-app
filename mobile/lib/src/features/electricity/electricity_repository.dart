import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

const discos = <String>[
  'IKEDC',
  'EKEDC',
  'AEDC',
  'PHED',
  'IBEDC',
  'EEDC',
  'KEDCO',
  'JED',
  'KAEDCO',
  'BEDC',
];

class MeterVerification {
  const MeterVerification({required this.customerName, required this.address});

  final String customerName;
  final String address;

  factory MeterVerification.fromJson(Map<String, dynamic> json) => MeterVerification(
        customerName: json['customerName'] as String,
        address: json['address'] as String,
      );
}

class ElectricityRepository {
  ElectricityRepository(this._api);

  final ApiClient _api;

  Future<MeterVerification> verifyMeter({
    required String disco,
    required String meterNumber,
    required String meterType,
  }) async {
    final response = await _api.dio.post(Endpoints.electricityVerifyMeter, data: {
      'disco': disco,
      'meterNumber': meterNumber,
      'meterType': meterType,
    });
    return MeterVerification.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> purchase({
    required String disco,
    required String meterNumber,
    required String meterType,
    required double amountNaira,
    String? pin,
  }) async {
    await _api.dio.post(Endpoints.electricityPurchase, data: {
      'disco': disco,
      'meterNumber': meterNumber,
      'meterType': meterType,
      'amountNaira': amountNaira,
      if (pin != null) 'pin': pin,
    });
  }
}

final electricityRepositoryProvider = Provider<ElectricityRepository>((ref) {
  return ElectricityRepository(ApiClient.instance);
});
