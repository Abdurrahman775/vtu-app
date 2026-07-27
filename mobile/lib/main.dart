import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/router/app_router.dart';
import 'src/core/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: VtuApp()));
}

class VtuApp extends StatelessWidget {
  const VtuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'VTU App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      routerConfig: appRouter,
    );
  }
}
