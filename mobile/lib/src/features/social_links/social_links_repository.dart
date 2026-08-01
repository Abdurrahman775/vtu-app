import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class SocialLink {
  const SocialLink({required this.platform, required this.url});

  final String platform;
  final String url;

  factory SocialLink.fromJson(Map<String, dynamic> json) => SocialLink(
        platform: json['platform'] as String,
        url: json['url'] as String,
      );
}

class SocialLinksRepository {
  SocialLinksRepository(this._api);

  final ApiClient _api;

  /// Only ever contains platforms an admin has actually configured — the
  /// Profile screen's "Follow us" section is hidden entirely when empty.
  Future<List<SocialLink>> list() async {
    final response = await _api.dio.get(Endpoints.socialLinks);
    final items = response.data['links'] as List;
    return items.map((item) => SocialLink.fromJson(item as Map<String, dynamic>)).toList();
  }
}

final socialLinksRepositoryProvider = Provider<SocialLinksRepository>((ref) {
  return SocialLinksRepository(ApiClient.instance);
});

final socialLinksProvider = FutureProvider.autoDispose<List<SocialLink>>((ref) {
  return ref.read(socialLinksRepositoryProvider).list();
});
