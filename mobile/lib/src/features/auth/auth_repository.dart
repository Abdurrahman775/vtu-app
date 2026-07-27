import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class AuthUser {
  const AuthUser({required this.id, required this.phone, required this.role});

  final String id;
  final String phone;
  final String role;

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        phone: json['phone'] as String,
        role: json['role'] as String,
      );
}

class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Future<void> requestOtp(String phone) async {
    await _api.dio.post(Endpoints.otpRequest, data: {'phone': phone});
  }

  Future<AuthUser> verifyOtp(String phone, String code) async {
    final response = await _api.dio.post(
      Endpoints.otpVerify,
      data: {'phone': phone, 'code': code},
    );
    final token = response.data['token'] as String;
    await _api.saveToken(token);
    return AuthUser.fromJson(response.data['user'] as Map<String, dynamic>);
  }

  Future<void> logout() => _api.clearToken();

  Future<bool> isLoggedIn() async => (await _api.readToken()) != null;
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ApiClient.instance);
});
