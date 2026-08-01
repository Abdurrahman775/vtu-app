import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _prefsKey = 'balance_hidden';

/// Persists whether the Home tab's wallet balance is hidden across app
/// restarts. Toggled both from the wallet card's eye icon and from
/// Settings' "Hide Balance" switch — both read/write this same state so
/// they can never drift out of sync.
class WalletVisibilityNotifier extends StateNotifier<bool> {
  WalletVisibilityNotifier() : super(false) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool(_prefsKey) ?? false;
  }

  Future<void> setHidden(bool hidden) async {
    state = hidden;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsKey, hidden);
  }

  Future<void> toggle() => setHidden(!state);
}

final balanceHiddenProvider = StateNotifierProvider<WalletVisibilityNotifier, bool>((ref) {
  return WalletVisibilityNotifier();
});
