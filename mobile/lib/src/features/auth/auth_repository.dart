import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

/// Carries the backend's actual reason a code was rejected (already
/// used / expired / superseded by a newer code / just wrong) instead of
/// a generic message — see `web/src/lib/otp.ts`'s `checkOtp`.
class OtpVerificationException implements Exception {
  const OtpVerificationException(this.message);
  final String message;
}

class AuthUser {
  const AuthUser({required this.id, required this.email, required this.phone, required this.role});

  final String id;
  final String email;

  /// Not collected at login/signup — see docs/AUTH.md. Still present for
  /// accounts created before phone was made optional, or set later.
  final String? phone;
  final String role;

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        role: json['role'] as String,
      );
}

class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Future<void> requestOtp(String email) async {
    await _api.dio.post(Endpoints.otpRequest, data: {'email': email});
  }

  Future<AuthUser> verifyOtp(String email, String code) async {
    try {
      final response = await _api.dio.post(
        Endpoints.otpVerify,
        data: {'email': email, 'code': code},
      );
      final token = response.data['token'] as String;
      await _api.saveToken(token);
      return AuthUser.fromJson(response.data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data is Map ? e.response?.data['error'] as String? : null;
      if (message != null) throw OtpVerificationException(message);
      rethrow;
    }
  }

  Future<void> logout() => _api.clearToken();

  Future<bool> isLoggedIn() async => (await _api.readToken()) != null;
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ApiClient.instance);
});
