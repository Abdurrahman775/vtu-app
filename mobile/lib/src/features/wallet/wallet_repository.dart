import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class WalletBalance {
  const WalletBalance({required this.balanceNaira, required this.currency});

  final double balanceNaira;
  final String currency;

  factory WalletBalance.fromJson(Map<String, dynamic> json) => WalletBalance(
        balanceNaira: (json['balanceNaira'] as num).toDouble(),
        currency: json['currency'] as String,
      );
}

class WalletRepository {
  WalletRepository(this._api);

  final ApiClient _api;

  Future<WalletBalance> getBalance() async {
    final response = await _api.dio.get(Endpoints.walletBalance);
    return WalletBalance.fromJson(response.data as Map<String, dynamic>);
  }

  /// Returns the Paystack checkout URL to open in a webview/browser.
  Future<String> fundWallet({required double amountNaira, required String email}) async {
    final response = await _api.dio.post(
      Endpoints.walletFund,
      data: {'amountNaira': amountNaira, 'email': email},
    );
    return response.data['authorizationUrl'] as String;
  }
}

final walletRepositoryProvider = Provider<WalletRepository>((ref) {
  return WalletRepository(ApiClient.instance);
});

final walletBalanceProvider = FutureProvider.autoDispose<WalletBalance>((ref) {
  return ref.read(walletRepositoryProvider).getBalance();
});
