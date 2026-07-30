import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../me/me_repository.dart';
import '../../wallet/screens/wallet_screen.dart';
import '../../airtime/screens/airtime_screen.dart';
import '../../data_bundle/screens/data_screen.dart';
import '../../cable_tv/screens/cable_screen.dart';
import '../../transactions/screens/transactions_screen.dart';
import '../../transactions/transactions_repository.dart';
import '../../transfer/screens/transfer_screen.dart';
import '../../profile/screens/profile_screen.dart';

class HomeTab extends ConsumerStatefulWidget {
  const HomeTab({super.key});

  @override
  ConsumerState<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends ConsumerState<HomeTab> {
  bool _balanceHidden = false;

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  void _comingSoon(String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$feature is coming soon')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(meProvider);
    final transactions = ref.watch(transactionsProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(meProvider);
            ref.invalidate(transactionsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _Header(
                displayName: me.maybeWhen(data: (m) => m.user.displayName, orElse: () => ''),
                avatarUrl: me.maybeWhen(data: (m) => m.user.avatarFullUrl, orElse: () => null),
                greeting: _greeting(),
                onBellTap: () => _comingSoon('Notifications'),
                onMenuTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                ),
              ),
              const SizedBox(height: 16),
              me.when(
                data: (m) => _WalletCard(
                  balanceNaira: m.wallet.balanceNaira,
                  virtualAccountNumber: m.wallet.virtualAccountNumber,
                  virtualAccountName: m.wallet.virtualAccountName,
                  hidden: _balanceHidden,
                  onToggleHidden: () => setState(() => _balanceHidden = !_balanceHidden),
                  onAddMoney: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const WalletScreen()),
                  ),
                  onHistory: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const TransactionsScreen()),
                  ),
                ),
                loading: () => const SizedBox(
                  height: 180,
                  child: Center(child: CircularProgressIndicator(color: Colors.white)),
                ),
                error: (e, _) => const SizedBox(
                  height: 180,
                  child: Center(child: Text('Could not load wallet')),
                ),
              ),
              const SizedBox(height: 24),
              const Text('Quick Services', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              _QuickServicesGrid(
                onAirtime: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AirtimeScreen()),
                ),
                onData: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const DataScreen()),
                ),
                onCableTv: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const CableScreen()),
                ),
                onFundWallet: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const WalletScreen()),
                ),
                onTransfer: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const TransferScreen()),
                ),
                onComingSoon: _comingSoon,
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Recent Transactions',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  TextButton(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const TransactionsScreen()),
                    ),
                    child: const Text('View All'),
                  ),
                ],
              ),
              transactions.when(
                data: (items) => items.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(child: Text('No transactions yet')),
                      )
                    : Column(
                        children: items
                            .take(5)
                            .map((t) => _TransactionTile(transaction: t))
                            .toList(),
                      ),
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text('Could not load transactions')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.displayName,
    required this.avatarUrl,
    required this.greeting,
    required this.onBellTap,
    required this.onMenuTap,
  });

  final String displayName;
  final String? avatarUrl;
  final String greeting;
  final VoidCallback onBellTap;
  final VoidCallback onMenuTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 22,
          backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
          child: avatarUrl == null
              ? Text(displayName.isNotEmpty ? displayName.substring(0, 1).toUpperCase() : '?')
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Hello, $displayName 👋',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis),
              Text(greeting, style: TextStyle(color: Colors.grey.shade600)),
            ],
          ),
        ),
        IconButton(icon: const Icon(Icons.notifications_none), onPressed: onBellTap),
        IconButton(icon: const Icon(Icons.menu), onPressed: onMenuTap),
      ],
    );
  }
}

class _WalletCard extends StatelessWidget {
  const _WalletCard({
    required this.balanceNaira,
    required this.virtualAccountNumber,
    required this.virtualAccountName,
    required this.hidden,
    required this.onToggleHidden,
    required this.onAddMoney,
    required this.onHistory,
  });

  final double balanceNaira;
  final String? virtualAccountNumber;
  final String? virtualAccountName;
  final bool hidden;
  final VoidCallback onToggleHidden;
  final VoidCallback onAddMoney;
  final VoidCallback onHistory;

  @override
  Widget build(BuildContext context) {
    final balanceText = hidden ? '₦ • • • • • •' : '₦${balanceNaira.toStringAsFixed(2)}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.walletGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('Wallet Balance', style: TextStyle(color: Colors.white70)),
              const SizedBox(width: 6),
              InkWell(
                onTap: onToggleHidden,
                child: Icon(hidden ? Icons.visibility_off : Icons.visibility,
                    color: Colors.white70, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(balanceText,
              style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(color: Colors.greenAccent, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
              const Text('Last updated just now', style: TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 12),
          if (virtualAccountNumber != null)
            Row(
              children: [
                Expanded(
                  child: Text(
                    '$virtualAccountNumber${virtualAccountName != null ? ' | $virtualAccountName' : ''}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                InkWell(
                  onTap: () => Clipboard.setData(ClipboardData(text: virtualAccountNumber!)),
                  child: const Icon(Icons.copy, color: Colors.white70, size: 16),
                ),
              ],
            )
          else
            const Text(
              'Fund your wallet to get started',
              style: TextStyle(color: Colors.white70),
            ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppTheme.seedColor),
                  onPressed: onAddMoney,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Money'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                  ),
                  onPressed: onHistory,
                  icon: const Icon(Icons.history),
                  label: const Text('History'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickServicesGrid extends StatelessWidget {
  const _QuickServicesGrid({
    required this.onAirtime,
    required this.onData,
    required this.onCableTv,
    required this.onFundWallet,
    required this.onTransfer,
    required this.onComingSoon,
  });

  final VoidCallback onAirtime;
  final VoidCallback onData;
  final VoidCallback onCableTv;
  final VoidCallback onFundWallet;
  final VoidCallback onTransfer;
  final void Function(String feature) onComingSoon;

  @override
  Widget build(BuildContext context) {
    final items = <_ServiceItem>[
      _ServiceItem(Icons.swap_horiz, 'Transfer', onTransfer),
      _ServiceItem(Icons.account_balance_wallet_outlined, 'Fund Wallet', onFundWallet),
      _ServiceItem(Icons.phone_iphone, 'Airtime', onAirtime),
      _ServiceItem(Icons.wifi, 'Data', onData),
      _ServiceItem(Icons.live_tv, 'Cable TV', onCableTv),
      _ServiceItem(Icons.bolt, 'Electricity', () => onComingSoon('Electricity')),
      _ServiceItem(Icons.school_outlined, 'Education', () => onComingSoon('Education')),
      _ServiceItem(Icons.language, 'Internet', () => onComingSoon('Internet')),
      _ServiceItem(Icons.description_outlined, 'Statement', () => onComingSoon('Statement')),
      _ServiceItem(Icons.grid_view, 'More', () => onComingSoon('More services')),
    ];

    return GridView.count(
      crossAxisCount: 5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 4,
      childAspectRatio: 0.75,
      children: items.map((item) => _ServiceTile(item: item)).toList(),
    );
  }
}

class _ServiceItem {
  const _ServiceItem(this.icon, this.label, this.onTap);
  final IconData icon;
  final String label;
  final VoidCallback onTap;
}

class _ServiceTile extends StatelessWidget {
  const _ServiceTile({required this.item});
  final _ServiceItem item;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: item.onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.seedColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(item.icon, color: AppTheme.seedColor),
          ),
          const SizedBox(height: 6),
          Text(item.label, style: const TextStyle(fontSize: 11), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.transaction});
  final TransactionSummary transaction;

  bool get _isCredit =>
      transaction.type == 'WALLET_FUNDING' ||
      (transaction.type == 'TRANSFER' && transaction.amountNaira > 0);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: (_isCredit ? Colors.green : Colors.orange).withValues(alpha: 0.12),
        child: Icon(
          _isCredit ? Icons.arrow_downward : Icons.arrow_upward,
          color: _isCredit ? Colors.green : Colors.orange,
          size: 18,
        ),
      ),
      title: Text('${transaction.type} — ${transaction.provider}'),
      subtitle: Text(transaction.status),
      trailing: Text(
        '${_isCredit ? '+' : '-'}₦${transaction.amountNaira.toStringAsFixed(2)}',
        style: TextStyle(
          color: _isCredit ? Colors.green : Colors.black87,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
