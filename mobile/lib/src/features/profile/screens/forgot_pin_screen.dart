import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../me/me_repository.dart';
import '../../auth/auth_repository.dart';

/// Recovery path for a forgotten or locked-out transaction PIN — reuses
/// the email+OTP channel the user already trusts for login rather than
/// needing the (missing) current PIN. See docs/TRANSACTION_PIN.md.
class ForgotPinScreen extends ConsumerStatefulWidget {
  const ForgotPinScreen({super.key, required this.email});

  final String email;

  @override
  ConsumerState<ForgotPinScreen> createState() => _ForgotPinScreenState();
}

class _ForgotPinScreenState extends ConsumerState<ForgotPinScreen> {
  bool _codeSent = false;
  bool _sending = false;
  bool _submitting = false;
  String _code = '';
  String _newPin = '';
  String _confirmPin = '';
  String? _error;

  Future<void> _sendCode() async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).requestOtp(widget.email);
      setState(() => _codeSent = true);
    } catch (e) {
      setState(() => _error = 'Could not send code. Please try again.');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _submit() async {
    if (_code.length != 6) {
      setState(() => _error = 'Enter the 6-digit code');
      return;
    }
    if (_newPin.length != 4) {
      setState(() => _error = 'PIN must be exactly 4 digits');
      return;
    }
    if (_newPin != _confirmPin) {
      setState(() => _error = 'PINs do not match');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(meRepositoryProvider).resetPin(code: _code, newPin: _newPin);
      ref.invalidate(meProvider);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Transaction PIN reset')));
        Navigator.of(context).pop();
      }
    } on PinException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not reset PIN. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Transaction PIN')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (!_codeSent) ...[
              Text("We'll send a verification code to ${widget.email}."),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _sending ? null : _sendCode,
                child: _sending
                    ? const SizedBox(
                        height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Send code'),
              ),
            ] else ...[
              Text('Enter the code sent to ${widget.email}'),
              const SizedBox(height: 12),
              PinCodeTextField(
                appContext: context,
                length: 6,
                keyboardType: TextInputType.number,
                onChanged: (v) => setState(() => _code = v),
                pinTheme: PinTheme(shape: PinCodeFieldShape.box, borderRadius: BorderRadius.circular(8)),
              ),
              const SizedBox(height: 20),
              const Text('New PIN'),
              const SizedBox(height: 8),
              PinCodeTextField(
                appContext: context,
                length: 4,
                obscureText: true,
                keyboardType: TextInputType.number,
                onChanged: (v) => setState(() => _newPin = v),
                pinTheme: PinTheme(shape: PinCodeFieldShape.box, borderRadius: BorderRadius.circular(8)),
              ),
              const SizedBox(height: 16),
              const Text('Confirm new PIN'),
              const SizedBox(height: 8),
              PinCodeTextField(
                appContext: context,
                length: 4,
                obscureText: true,
                keyboardType: TextInputType.number,
                onChanged: (v) => setState(() => _confirmPin = v),
                pinTheme: PinTheme(shape: PinCodeFieldShape.box, borderRadius: BorderRadius.circular(8)),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Reset PIN'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
