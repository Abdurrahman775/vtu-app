/// Used on the VM (`flutter test`) and any native platform without its
/// own download implementation yet. Native builds should get a real
/// implementation (path_provider + share) before this is relied on.
void downloadReceiptAsFile(String filename, String contents) {
  throw UnsupportedError('Saving a receipt file is only supported on web right now.');
}
