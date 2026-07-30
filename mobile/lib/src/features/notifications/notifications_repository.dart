import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final bool read;
  final DateTime createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String,
        type: json['type'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        read: json['read'] as bool,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        type: type,
        title: title,
        body: body,
        read: read ?? this.read,
        createdAt: createdAt,
      );
}

class NotificationsPage {
  const NotificationsPage({required this.items, required this.unreadCount});

  final List<AppNotification> items;
  final int unreadCount;
}

class NotificationsRepository {
  NotificationsRepository(this._api);

  final ApiClient _api;

  Future<NotificationsPage> list() async {
    final response = await _api.dio.get(Endpoints.notifications);
    final items = (response.data['notifications'] as List)
        .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
        .toList();
    return NotificationsPage(items: items, unreadCount: response.data['unreadCount'] as int);
  }

  Future<void> markRead(String id) async {
    await _api.dio.post(Endpoints.notificationRead(id));
  }

  Future<void> markAllRead() async {
    await _api.dio.post(Endpoints.notificationsReadAll);
  }
}

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  return NotificationsRepository(ApiClient.instance);
});

final notificationsProvider = FutureProvider.autoDispose<NotificationsPage>((ref) {
  return ref.read(notificationsRepositoryProvider).list();
});
