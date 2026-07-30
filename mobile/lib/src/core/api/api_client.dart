import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Base URL for the Next.js backend. Override with --dart-define=API_BASE_URL=...
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000/api',
);

/// Same host as [kApiBaseUrl] without the `/api` suffix — used to resolve
/// static asset paths like `avatarUrl` (e.g. `/uploads/foo.png`) returned
/// by the backend, which aren't under `/api`.
String get kApiHostUrl => kApiBaseUrl.replaceFirst(RegExp(r'/api/?$'), '');

class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: kApiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: _tokenKey);
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();

  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  Dio get dio => _dio;

  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);
}
