import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class ProviderLogosRepository {
  ProviderLogosRepository(this._api);

  final ApiClient _api;

  /// Maps provider code (e.g. "MTN") -> full logo image URL, for whatever
  /// providers an admin has uploaded a real logo for. A provider missing
  /// from this map just falls back to the generated color badge — see
  /// `mobile/lib/src/core/widgets/provider_badge.dart`.
  Future<Map<String, String>> list() async {
    final response = await _api.dio.get(Endpoints.providerLogos);
    final items = response.data['logos'] as List;
    return {
      for (final item in items.cast<Map<String, dynamic>>())
        item['provider'] as String: '$kApiHostUrl${item['imageUrl']}',
    };
  }
}

final providerLogosRepositoryProvider = Provider<ProviderLogosRepository>((ref) {
  return ProviderLogosRepository(ApiClient.instance);
});

final providerLogosProvider = FutureProvider.autoDispose<Map<String, String>>((ref) {
  return ref.read(providerLogosRepositoryProvider).list();
});
