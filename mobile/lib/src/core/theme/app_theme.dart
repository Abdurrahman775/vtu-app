import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  static const seedColor = Color(0xFF0B6E4F);

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: seedColor),
      appBarTheme: const AppBarTheme(centerTitle: true),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
        filled: true,
      ),
    );
  }
}
