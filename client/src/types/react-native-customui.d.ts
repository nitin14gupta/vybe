declare module 'react-native-customui' {
  export interface RazorpayOptions {
    description?: string;
    currency?: string;
    key_id?: string;
    amount?: string | number;
    email?: string;
    contact?: string;
    method?: string;
    upi_app_package_name?: string;
    '_[flow]'?: string;
    '_[vpa]'?: string;
    order_id?: string;
    name?: string;
    [key: string]: any;
  }

  export interface UpiAppResponse {
    appName?: string;
    packageName?: string;
    iconBase64?: string;
    appLogo?: string;
    [key: string]: any;
  }

  export default class RazorpayCustomUI {
    static open(options: RazorpayOptions): Promise<any>;
    static getAppsWhichSupportUPI(callback: (data: { data: UpiAppResponse[] }) => void): void;
    static getPaymentMethods(callback: (data: any) => void): Promise<any>;
    static getRecommendedInstruments(options: any, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<any>;
    static initRazorpay(key: string): Promise<any>;
    static getCardsNetwork(cardNumber: string): Promise<any>;
    static isCredAppAvailable(): Promise<any>;
    static getWalletLogoUrl(walletName: string): Promise<any>;
    static getSubscriptionAmount(subscriptionId: string): Promise<any>;
    static calculateEmi(principleAmount: number, durationInMonths: number, annualInterestRate: number): Promise<any>;
    static getCardNetworkLength(networkName: string): Promise<any>;
    static isValidCardNumber(cardNumber: string): Promise<any>;
    static isValidVpa(vpaAddress: string): Promise<any>;
    static getBankLogoUrl(bankName: string): Promise<any>;
    static getSqWalletLogoUrl(walletName: string): Promise<any>;
    static validateOptions(payload: any): Promise<any>;
  }
}
