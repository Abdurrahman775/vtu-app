import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../auth_repository.dart';
import '../../home/screens/home_screen.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.phone});

  static const routePath = '/otp';

  final String phone;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  String _code = '';
  bool _loading = false;
  String? _error;

  Future<void> _verify() async {
    if (_code.length != 6) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).verifyOtp(widget.phone, _code);
      if (!mounted) return;
      context.go(HomeScreen.routePath);
    } catch (e) {
      setState(() => _error = 'Invalid or expired code');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify your number')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Enter the code sent to ${widget.phone}'),
            const SizedBox(height: 24),
            PinCodeTextField(
              appContext: context,
              length: 6,
              onChanged: (value) => setState(() => _code = value),
              onCompleted: (_) => _verify(),
              pinTheme: PinTheme(shape: PinCodeFieldShape.box, borderRadius: BorderRadius.circular(8)),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _verify,
              child: _loading
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Verify'),
            ),
          ],
        ),
      ),
    );
  }
}
