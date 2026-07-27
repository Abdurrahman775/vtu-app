/// Matches the route handlers under web/src/app/api/**
class Endpoints {
  Endpoints._();

  static const otpRequest = '/auth/otp/request';
  static const otpVerify = '/auth/otp/verify';

  static const me = '/me';

  static const walletBalance = '/wallet/balance';
  static const walletFund = '/wallet/fund';
  static const walletTransfer = '/wallet/transfer';

  static const airtimePurchase = '/airtime/purchase';
  static const dataPurchase = '/data/purchase';
  static const cablePurchase = '/cable/purchase';

  static const transactions = '/transactions';
}
