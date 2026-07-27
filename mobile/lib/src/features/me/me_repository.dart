import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class MeUser {
  const MeUser({required this.id, required this.phone, this.fullName});

  final String id;
  final String phone;
  final String? fullName;

  /// Falls back to the phone number until the user sets a display name.
  String get displayName => fullName?.isNotEmpty == true ? fullName! : phone;
}

class MeWallet {
  const MeWallet({
    required this.balanceNaira,
    required this.currency,
    this.virtualAccountNumber,
    this.virtualAccountBankName,
    this.virtualAccountName,
  });

  final double balanceNaira;
  final String currency;
  final String? virtualAccountNumber;
  final String? virtualAccountBankName;
  final String? virtualAccountName;
}

class Me {
  const Me({required this.user, required this.wallet});

  final MeUser user;
  final MeWallet wallet;

  factory Me.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'] as Map<String, dynamic>;
    final walletJson = json['wallet'] as Map<String, dynamic>;
    return Me(
      user: MeUser(
        id: userJson['id'] as String,
        phone: userJson['phone'] as String,
        fullName: userJson['fullName'] as String?,
      ),
      wallet: MeWallet(
        balanceNaira: (walletJson['balanceNaira'] as num).toDouble(),
        currency: walletJson['currency'] as String,
        virtualAccountNumber: walletJson['virtualAccountNumber'] as String?,
        virtualAccountBankName: walletJson['virtualAccountBankName'] as String?,
        virtualAccountName: walletJson['virtualAccountName'] as String?,
      ),
    );
  }
}

class MeRepository {
  MeRepository(this._api);

  final ApiClient _api;

  Future<Me> getMe() async {
    final response = await _api.dio.get(Endpoints.me);
    return Me.fromJson(response.data as Map<String, dynamic>);
  }
}

final meRepositoryProvider = Provider<MeRepository>((ref) {
  return MeRepository(ApiClient.instance);
});

final meProvider = FutureProvider.autoDispose<Me>((ref) {
  return ref.read(meRepositoryProvider).getMe();
});
