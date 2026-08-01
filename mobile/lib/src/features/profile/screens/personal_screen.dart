import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../me/me_repository.dart';

/// Chipper Cash's mockup shows multiple phones/emails, an address, and
/// a business-account upgrade — this app only has one email (the login
/// ID, not editable here) and one optional phone, so this screen is
/// scoped to just those two, matching what the backend actually
/// supports (`PATCH /api/me { phone }`).
class PersonalScreen extends ConsumerStatefulWidget {
  const PersonalScreen({super.key});

  @override
  ConsumerState<PersonalScreen> createState() => _PersonalScreenState();
}

class _PersonalScreenState extends ConsumerState<PersonalScreen> {
  bool _saving = false;

  Future<void> _editPhone(String? currentPhone) async {
    final controller = TextEditingController(text: currentPhone ?? '');
    final newPhone = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(currentPhone == null ? 'Add phone number' : 'Change phone number'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Phone number'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (newPhone == null || newPhone.isEmpty || newPhone == currentPhone) return;
    await _updatePhone(newPhone);
  }

  Future<void> _removePhone() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove phone number?'),
        content: const Text("You won't be able to send/receive wallet transfers by phone until you add one again."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await _updatePhone(null);
  }

  Future<void> _updatePhone(String? phone) async {
    setState(() => _saving = true);
    try {
      await ref.read(meRepositoryProvider).updatePhone(phone);
      ref.invalidate(meProvider);
    } on PhoneUpdateException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not update phone number. Please try again.')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(meProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Personal')),
      body: me.when(
        data: (m) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Email', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                title: Text(m.user.email),
                subtitle: const Text('Used to sign in — not editable here'),
              ),
            ),
            const SizedBox(height: 20),
            const Text('Phone number', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Card(
              child: _saving
                  ? const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  : m.user.phone != null
                      ? ListTile(
                          title: Text(m.user.phone!),
                          trailing: Wrap(
                            spacing: 4,
                            children: [
                              TextButton(onPressed: () => _editPhone(m.user.phone), child: const Text('Change')),
                              TextButton(
                                onPressed: _removePhone,
                                style: TextButton.styleFrom(foregroundColor: Colors.red),
                                child: const Text('Remove'),
                              ),
                            ],
                          ),
                        )
                      : ListTile(
                          title: const Text('No phone number added'),
                          trailing: TextButton(onPressed: () => _editPhone(null), child: const Text('Add')),
                        ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(child: Text('Could not load your details')),
      ),
    );
  }
}
