import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../me/me_repository.dart';
import 'forgot_pin_screen.dart';

/// Handles both first-time PIN creation and changing an existing one —
/// [hasPin] controls whether the "current PIN" field (and the "Forgot
/// PIN?" recovery link) is shown/required. See docs/TRANSACTION_PIN.md.
class ChangePinScreen extends ConsumerStatefulWidget {
  const ChangePinScreen({super.key, required this.hasPin, required this.email});

  final bool hasPin;
  final String email;

  @override
  ConsumerState<ChangePinScreen> createState() => _ChangePinScreenState();
}

class _ChangePinScreenState extends ConsumerState<ChangePinScreen> {
  final _currentPinController = TextEditingController();
  String _newPin = '';
  String _confirmPin = '';
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (_newPin.length != 4) {
      setState(() => _error = 'PIN must be exactly 4 digits');
      return;
    }
    if (_newPin != _confirmPin) {
      setState(() => _error = 'PINs do not match');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(meRepositoryProvider).setPin(
            currentPin: widget.hasPin ? _currentPinController.text.trim() : null,
            newPin: _newPin,
          );
      ref.invalidate(meProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.hasPin ? 'Transaction PIN changed' : 'Transaction PIN set')),
        );
        Navigator.of(context).pop();
      }
    } on PinException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not save PIN. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.hasPin ? 'Change Transaction PIN' : 'Set Transaction PIN')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (widget.hasPin) ...[
              TextField(
                controller: _currentPinController,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 4,
                decoration: const InputDecoration(labelText: 'Current PIN', counterText: ''),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ForgotPinScreen(email: widget.email)),
                  ),
                  child: const Text('Forgot PIN?'),
                ),
              ),
            ] else
              const Text(
                'This PIN will be required for every wallet transfer and purchase from now on.',
              ),
            const SizedBox(height: 16),
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
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(widget.hasPin ? 'Change PIN' : 'Set PIN'),
            ),
          ],
        ),
      ),
    );
  }
}
