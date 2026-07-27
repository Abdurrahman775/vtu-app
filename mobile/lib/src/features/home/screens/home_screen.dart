import 'package:flutter/material.dart';
import '../../wallet/screens/wallet_screen.dart';
import '../../airtime/screens/airtime_screen.dart';
import '../../data_bundle/screens/data_screen.dart';
import '../../cable_tv/screens/cable_screen.dart';
import '../../transactions/screens/transactions_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  static const routePath = '/home';

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  static const _tabs = [
    WalletScreen(),
    _ServicesTab(),
    TransactionsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
          NavigationDestination(icon: Icon(Icons.grid_view), label: 'Services'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'History'),
        ],
      ),
    );
  }
}

class _ServicesTab extends StatelessWidget {
  const _ServicesTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Services')),
      body: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: [
          _ServiceTile(
            icon: Icons.phone_android,
            label: 'Airtime',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AirtimeScreen()),
            ),
          ),
          _ServiceTile(
            icon: Icons.wifi,
            label: 'Data',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DataScreen()),
            ),
          ),
          _ServiceTile(
            icon: Icons.live_tv,
            label: 'Cable TV',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CableScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceTile extends StatelessWidget {
  const _ServiceTile({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40),
            const SizedBox(height: 8),
            Text(label),
          ],
        ),
      ),
    );
  }
}
