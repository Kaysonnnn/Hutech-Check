import { BarcodeScanner } from "@jigra-mlkit/barcode-scanning";

export const requestBarcodeScannerPermission = async () => {
  const { camera } = await BarcodeScanner.requestPermissions();
  return camera === "granted" || camera === "limited";
};
