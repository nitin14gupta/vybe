// Razorpay's iOS SDK only reports a bare app-name string for UPI apps (no
// package id, no scheme, no icon — see node_modules/react-native-customui/
// ios/RazorpayEventEmitterCustom.m upiApps:), so on iOS we detect + icon
// these ourselves via Linking.canOpenURL against each app's URL scheme.
// `package_name` here is kept for parity with the Android/Razorpay shape
// (used as the React key and to route the payment intent) even though iOS
// has no real package id — it's just this app's identifying slug.
export interface IosUpiAppDef {
  app_name: string;
  package_name: string;
  scheme: string;
  // Swap in real bundled icon files (drop them next to this file's
  // referenced path) — until then these fall back to the letter avatar.
  icon: number | null;
}

export const IOS_UPI_APPS: IosUpiAppDef[] = [
  {
    app_name: "Google Pay",
    package_name: "com.google.android.apps.nbu.paisa.user",
    scheme: "tez",
    icon: null,
  },
  {
    app_name: "PhonePe",
    package_name: "com.phonepe.app",
    scheme: "phonepe",
    icon: null,
  },
  {
    app_name: "Paytm",
    package_name: "net.one97.paytm",
    scheme: "paytmmp",
    icon: null,
  },
  {
    app_name: "BHIM",
    package_name: "in.org.npci.upiapp",
    scheme: "bhim",
    icon: null,
  },
  {
    app_name: "CRED",
    package_name: "com.dreamplug.androidapp",
    scheme: "credpay",
    icon: null,
  },
  {
    app_name: "Amazon Pay",
    package_name: "in.amazon.mShop.android.shopping",
    scheme: "amazonpay",
    icon: null,
  },
];
