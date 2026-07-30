import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:vtu_app/main.dart';

void main() {
  // flutter_secure_storage has no platform implementation in the plain
  // widget-test environment; without this the app's root route redirect
  // (which reads the stored token) never resolves and the screen stays
  // blank. Mock it to behave like a device with no stored session.
  setUp(() {
    const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (MethodCall methodCall) async {
      if (methodCall.method == 'read') return null;
      return null;
    });
  });

  testWidgets('app boots to the login screen when no session is stored', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: VtuApp()));
    await tester.pumpAndSettle();

    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Email address'), findsOneWidget);
  });
}
