import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../notifications_repository.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    final dateFormat = DateFormat('MMM d, y • h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          notifications.maybeWhen(
            data: (page) => page.unreadCount > 0
                ? TextButton(
                    onPressed: () async {
                      await ref.read(notificationsRepositoryProvider).markAllRead();
                      ref.invalidate(notificationsProvider);
                    },
                    child: const Text('Mark all read'),
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(notificationsProvider.future),
        child: notifications.when(
          data: (page) => page.items.isEmpty
              ? const Center(child: Text('No notifications yet'))
              : ListView.separated(
                  itemCount: page.items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final n = page.items[index];
                    return ListTile(
                      leading: Icon(
                        Icons.notifications,
                        color: n.read ? Colors.grey : Theme.of(context).colorScheme.primary,
                      ),
                      title: Text(n.title, style: TextStyle(fontWeight: n.read ? FontWeight.normal : FontWeight.bold)),
                      subtitle: Text('${n.body}\n${dateFormat.format(n.createdAt)}'),
                      isThreeLine: true,
                      onTap: n.read
                          ? null
                          : () async {
                              await ref.read(notificationsRepositoryProvider).markRead(n.id);
                              ref.invalidate(notificationsProvider);
                            },
                    );
                  },
                ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => const Center(child: Text('Could not load notifications')),
        ),
      ),
    );
  }
}
