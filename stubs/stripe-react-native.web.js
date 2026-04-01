/**
 * Web stub for @stripe/stripe-react-native (native-only SDK).
 * Expo web cannot load codegenNativeCommands; payments on web need @stripe/react-stripe-js separately.
 */
import React from 'react';

const webError = { message: 'Stripe native SDK is not used on web. Use iOS/Android for card flows.' };
const noopErr = async () => ({ error: webError });
const noopOk = async () => ({});

export function StripeProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export const initStripe = async () => {};

export const CardField = () => null;
export const CardForm = () => null;
export const AuBECSDebitForm = () => null;
export const StripeContainer = ({ children }) =>
  React.createElement(React.Fragment, null, children);
export const AddToWalletButton = () => null;
export const AddressSheet = () => null;
export const PlatformPayButton = () => null;

const stripeLike = {
  createPaymentMethod: noopErr,
  confirmPayment: noopErr,
  confirmSetupIntent: noopErr,
  handleNextAction: noopErr,
  handleNextActionForSetup: noopErr,
  retrievePaymentIntent: noopErr,
  retrieveSetupIntent: noopErr,
  initPaymentSheet: noopErr,
  presentPaymentSheet: noopErr,
  confirmPaymentSheetPayment: noopErr,
};

export function useStripe() {
  return stripeLike;
}

export function useConfirmPayment() {
  return { confirmPayment: noopErr };
}

export function useConfirmSetupIntent() {
  return { confirmSetupIntent: noopErr };
}

export function usePlatformPay() {
  return { isPlatformPaySupported: async () => false };
}

export function usePaymentSheet() {
  return {
    initPaymentSheet: noopErr,
    presentPaymentSheet: noopErr,
    confirmPaymentSheetPayment: noopErr,
    resetPaymentSheetCustomer: noopOk,
  };
}

export function useFinancialConnectionsSheet() {
  return { present: noopErr };
}

export const createPaymentMethod = noopErr;
export const createToken = noopErr;
export const retrievePaymentIntent = noopErr;
export const retrieveSetupIntent = noopErr;
export const confirmPayment = noopErr;
export const confirmSetupIntent = noopErr;
export const handleNextAction = noopErr;
export const handleNextActionForSetup = noopErr;
export const handleURLCallback = async () => false;
export const initPaymentSheet = noopErr;
export const presentPaymentSheet = noopErr;
export const confirmPaymentSheetPayment = noopErr;
export const resetPaymentSheetCustomer = noopOk;
export const Constants = {};
