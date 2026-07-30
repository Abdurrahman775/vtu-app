import 'package:flutter/material.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

/// Shows a modal PIN-entry dialog and returns the 4-digit PIN entered, or
/// null if the user cancelled. Called by every purchase/transfer screen
/// right before submitting, only when the signed-in user has a PIN set
/// (`MeUser.hasPin`) — see docs/TRANSACTION_PIN.md.
Future<String?> promptForTransactionPin(BuildContext context) {
  String pin = '';
  return showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Enter your transaction PIN'),
      content: SizedBox(
        width: 240,
        child: PinCodeTextField(
          appContext: context,
          length: 4,
          obscureText: true,
          autoFocus: true,
          keyboardType: TextInputType.number,
          onChanged: (value) => pin = value,
          onCompleted: (value) => Navigator.pop(context, value),
          pinTheme: PinTheme(shape: PinCodeFieldShape.box, borderRadius: BorderRadius.circular(8)),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(
          onPressed: () => Navigator.pop(context, pin.length == 4 ? pin : null),
          child: const Text('Confirm'),
        ),
      ],
    ),
  );
}
