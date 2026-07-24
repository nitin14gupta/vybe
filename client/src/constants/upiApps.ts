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
  // require()'d from assets/images/payments/upi-apps/ — Amazon Pay doesn't
  // have a bundled icon yet, so it stays null and falls back to the letter
  // avatar until an icon file is added for it.
  icon: number | null;
}

export const IOS_UPI_APPS: IosUpiAppDef[] = [
  {
    app_name: "Google Pay",
    package_name: "com.google.android.apps.nbu.paisa.user",
    scheme: "tez",
    icon: require("../../assets/images/payments/upi-apps/gpay.png"),
  },
  {
    app_name: "PhonePe",
    package_name: "com.phonepe.app",
    scheme: "phonepe",
    icon: require("../../assets/images/payments/upi-apps/phonepe.png"),
  },
  {
    app_name: "Paytm",
    package_name: "net.one97.paytm",
    scheme: "paytmmp",
    icon: require("../../assets/images/payments/upi-apps/paytm.png"),
  },
  {
    app_name: "BHIM",
    package_name: "in.org.npci.upiapp",
    scheme: "bhim",
    icon: require("../../assets/images/payments/upi-apps/bhim.png"),
  },
  {
    app_name: "CRED",
    package_name: "com.dreamplug.androidapp",
    scheme: "credpay",
    icon: require("../../assets/images/payments/upi-apps/cred.png"),
  },
  {
    app_name: "Amazon Pay",
    package_name: "in.amazon.mShop.android.shopping",
    scheme: "amazonpay",
    icon: null,
  },
];
