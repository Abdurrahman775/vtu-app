import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/home/screens/home_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      // Shown briefly while the redirect below checks secure storage for a
      // token, so a slow read shows a spinner instead of a blank screen.
      builder: (context, state) =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      redirect: (context, state) async {
        final token = await ApiClient.instance.readToken();
        return token != null ? HomeScreen.routePath : '/login';
      },
    ),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: OtpScreen.routePath,
      builder: (context, state) => OtpScreen(phone: state.extra as String),
    ),
    GoRoute(path: HomeScreen.routePath, builder: (context, state) => const HomeScreen()),
  ],
);
