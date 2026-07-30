import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

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
    required this.phone,
    this.fullName,
    this.avatarUrl,
    required this.isVerified,
    this.latestVerificationRequestStatus,
  });

  final String id;
  final String phone;
  final String? fullName;
  final String? avatarUrl;
  final bool isVerified;

  /// One of PENDING / APPROVED / REJECTED, or null if never requested.
  final String? latestVerificationRequestStatus;

  /// Falls back to the phone number until the user sets a display name.
  String get displayName => fullName?.isNotEmpty == true ? fullName! : phone;

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
        phone: userJson['phone'] as String,
        fullName: userJson['fullName'] as String?,
        avatarUrl: userJson['avatarUrl'] as String?,
        isVerified: userJson['isVerified'] as bool? ?? false,
        latestVerificationRequestStatus: userJson['latestVerificationRequestStatus'] as String?,
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
}

final meRepositoryProvider = Provider<MeRepository>((ref) {
  return MeRepository(ApiClient.instance);
});

final meProvider = FutureProvider.autoDispose<Me>((ref) {
  return ref.read(meRepositoryProvider).getMe();
});
