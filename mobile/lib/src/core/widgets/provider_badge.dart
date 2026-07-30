import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/provider_logos/provider_logos_repository.dart';

/// Color-coded stand-in for a real provider logo, used whenever an admin
/// hasn't uploaded a real one for this provider (see
/// `docs/PROVIDER_LOGOS.md`) — no licensed brand artwork ships with this
/// app by default.
class ProviderBrand {
  const ProviderBrand({required this.short, required this.color, this.textColor = Colors.white});

  final String short;
  final Color color;
  final Color textColor;
}

const Map<String, ProviderBrand> providerBrands = {
  // Airtime / data networks
  'MTN': ProviderBrand(short: 'MTN', color: Color(0xFFFFCC00), textColor: Colors.black),
  'AIRTEL': ProviderBrand(short: 'AIR', color: Color(0xFFED1C24)),
  'GLO': ProviderBrand(short: 'GLO', color: Color(0xFF00A651)),
  '9MOBILE': ProviderBrand(short: '9M', color: Color(0xFF00A99D)),

  // Cable TV
  'DSTV': ProviderBrand(short: 'DSTV', color: Color(0xFF0A5FAD)),
  'GOTV': ProviderBrand(short: 'GOtv', color: Color(0xFF6DBE45)),
  'STARTIMES': ProviderBrand(short: 'ST', color: Color(0xFFEE3124)),

  // Exam pins
  'WAEC': ProviderBrand(short: 'WAEC', color: Color(0xFF1D4ED8)),
  'NECO': ProviderBrand(short: 'NECO', color: Color(0xFF16A34A)),

  // Electricity discos
  'IKEDC': ProviderBrand(short: 'IKE', color: Color(0xFF0EA5E9)),
  'EKEDC': ProviderBrand(short: 'EKE', color: Color(0xFF6366F1)),
  'AEDC': ProviderBrand(short: 'AEDC', color: Color(0xFFF59E0B), textColor: Colors.black),
  'PHED': ProviderBrand(short: 'PHED', color: Color(0xFF10B981)),
  'IBEDC': ProviderBrand(short: 'IBE', color: Color(0xFFEF4444)),
  'EEDC': ProviderBrand(short: 'EEDC', color: Color(0xFF8B5CF6)),
  'KEDCO': ProviderBrand(short: 'KED', color: Color(0xFF14B8A6)),
  'JED': ProviderBrand(short: 'JED', color: Color(0xFFF97316)),
  'KAEDCO': ProviderBrand(short: 'KAE', color: Color(0xFF3B82F6)),
  'BEDC': ProviderBrand(short: 'BEDC', color: Color(0xFFA855F7)),
};

/// [code]'s logo — a real admin-uploaded image if one exists
/// (`providerLogosProvider`), otherwise the generated color badge from
/// [providerBrands].
class ProviderBadge extends ConsumerWidget {
  const ProviderBadge({super.key, required this.code, this.size = 28});

  final String code;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logos = ref.watch(providerLogosProvider).maybeWhen(data: (m) => m, orElse: () => const {});
    final logoUrl = logos[code];

    if (logoUrl != null) {
      return ClipOval(
        child: Image.network(
          logoUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _ColorBadge(code: code, size: size),
        ),
      );
    }

    return _ColorBadge(code: code, size: size);
  }
}

class _ColorBadge extends StatelessWidget {
  const _ColorBadge({required this.code, required this.size});

  final String code;
  final double size;

  @override
  Widget build(BuildContext context) {
    final brand = providerBrands[code];
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: brand?.color ?? Colors.grey.shade400,
        shape: BoxShape.circle,
      ),
      child: Text(
        brand?.short ?? code.substring(0, code.length.clamp(0, 3)),
        style: TextStyle(
          color: brand?.textColor ?? Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: size * 0.32,
        ),
        textAlign: TextAlign.center,
        maxLines: 1,
        overflow: TextOverflow.clip,
      ),
    );
  }
}
