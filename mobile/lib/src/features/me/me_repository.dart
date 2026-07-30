import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

/// Carries the backend's actual reason a PIN change was rejected (e.g.
/// "Current PIN is incorrect") instead of a generic message.
class PinException implements Exception {
  const PinException(this.message);
  final String message;
}

/// Matches web/src/app/api/me/avatar/route.ts's ALLOWED_TYPES — dio's
/// MultipartFile.fromBytes defaults to application/octet-stream, which
/// the backend would reject, so this must be set explicitly.
MediaType? _mediaTypeForFilename(String filename) {
  final lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return MediaType('image', 'png');
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return MediaType('image', 'jpeg');
  if (lower.endsWith('.webp')) return MediaType('image', 'webp');
  return null;
}

class MeUser {
  const MeUser({
    required this.id,
    required this.email,
    required this.phone,
    this.fullName,
    this.avatarUrl,
    required this.isVerified,
    this.latestVerificationRequestStatus,
    required this.hasPin,
  });

  final String id;
  final String email;

  /// Not collected at login/signup — see docs/AUTH.md. May be null.
  final String? phone;
  final String? fullName;
  final String? avatarUrl;
  final bool isVerified;

  /// Whether a transaction PIN has been set — see docs/TRANSACTION_PIN.md.
  /// Purchase/transfer screens should prompt for a PIN before submitting
  /// only when this is true.
  final bool hasPin;

  /// One of PENDING / APPROVED / REJECTED, or null if never requested.
  final String? latestVerificationRequestStatus;

  /// Falls back to email until the user sets a display name.
  String get displayName => fullName?.isNotEmpty == true ? fullName! : email;

  /// Full URL for [avatarUrl] (the API returns a host-relative path).
  String? get avatarFullUrl => avatarUrl == null ? null : '$kApiHostUrl$avatarUrl';
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
        email: userJson['email'] as String,
        phone: userJson['phone'] as String?,
        fullName: userJson['fullName'] as String?,
        avatarUrl: userJson['avatarUrl'] as String?,
        isVerified: userJson['isVerified'] as bool? ?? false,
        latestVerificationRequestStatus: userJson['latestVerificationRequestStatus'] as String?,
        hasPin: userJson['hasPin'] as bool? ?? false,
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

  Future<void> updateFullName(String fullName) async {
    await _api.dio.patch(Endpoints.me, data: {'fullName': fullName});
  }

  /// Takes an [XFile] (from image_picker) rather than a dart:io File —
  /// dart:io doesn't behave the same on web, so reading bytes directly
  /// through XFile keeps this working on every platform.
  Future<void> uploadAvatar(XFile imageFile) async {
    final bytes = await imageFile.readAsBytes();
    final formData = FormData.fromMap({
      'avatar': MultipartFile.fromBytes(
        bytes,
        filename: imageFile.name,
        contentType: _mediaTypeForFilename(imageFile.name),
      ),
    });
    await _api.dio.post(Endpoints.meAvatar, data: formData);
  }

  Future<void> requestVerification({String? note}) async {
    await _api.dio.post(Endpoints.verificationRequest, data: {
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  /// Sets a transaction PIN for the first time, or changes an existing
  /// one — `currentPin` is only needed (and checked) if one is already
  /// set. See docs/TRANSACTION_PIN.md.
  Future<void> setPin({String? currentPin, required String newPin}) async {
    try {
      await _api.dio.post(Endpoints.mePin, data: {
        if (currentPin != null && currentPin.isNotEmpty) 'currentPin': currentPin,
        'newPin': newPin,
      });
    } on DioException catch (e) {
      final message = e.response?.data is Map ? e.response?.data['error'] as String? : null;
      if (message != null) throw PinException(message);
      rethrow;
    }
  }

  /// Recovery path for a forgotten/locked-out PIN — `code` is an OTP
  /// just requested via `AuthRepository.requestOtp` for the user's own
  /// email, proving identity strongly enough to skip `currentPin`.
  Future<void> resetPin({required String code, required String newPin}) async {
    try {
      await _api.dio.post(Endpoints.mePinReset, data: {'code': code, 'newPin': newPin});
    } on DioException catch (e) {
      final message = e.response?.data is Map ? e.response?.data['error'] as String? : null;
      if (message != null) throw PinException(message);
      rethrow;
    }
  }
}

final meRepositoryProvider = Provider<MeRepository>((ref) {
  return MeRepository(ApiClient.instance);
});

final meProvider = FutureProvider.autoDispose<Me>((ref) {
  return ref.read(meRepositoryProvider).getMe();
});
