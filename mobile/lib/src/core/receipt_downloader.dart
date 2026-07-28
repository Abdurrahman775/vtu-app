// Triggers a browser download of the receipt as a .txt file.
//
// Conditionally backed by dart:html on web only — dart:html doesn't
// exist on the VM (breaks `flutter test`) or on native iOS/Android, so
// importing it directly here would break every non-web target.
export 'receipt_downloader_stub.dart'
    if (dart.library.html) 'receipt_downloader_web.dart';
