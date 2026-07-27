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
