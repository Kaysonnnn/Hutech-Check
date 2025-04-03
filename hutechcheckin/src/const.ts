import Decimal from "decimal.js";

export const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
export const phonePattern = /(0[3|5|7|8|9])+([0-9]{8})\b/;

export const formatCurrency = (number: any) => {
  const nb = "" + number;
  const result = nb.replace(
    /(?:(^\d{1,3})(?=(?:\d{3})*$)|(\d{3}))(?!$)/gm,
    "$1$2."
  );

  return result;
};

export const isNumber = (value: any) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const calculateDiscount = (price: number, discount: number) => {
  // e.g. price = 10000, discount = 10 => 10000 * (1 - 10/100) = 9000
  return new Decimal(price).times(
    new Decimal(1).minus(new Decimal(discount).dividedBy(100))
  );
};

export const getFullDate = () => {
  const date = new Date();
  let day: any = date.getDate();
  let month: any = date.getMonth() + 1;
  const year = date.getFullYear();

  if (day < 10) day = "0" + day;
  if (month < 10) month = "0" + month;

  return day + "/" + month + "/" + year;
};

export const getFullTime = () => {
  const time = new Date();
  let hours: any = time.getHours();
  let minutes: any = time.getMinutes();
  let seconds: any = time.getSeconds();

  if (hours < 10) hours = "0" + hours;
  if (minutes < 10) minutes = "0" + minutes;
  if (seconds < 10) seconds = "0" + seconds;

  return hours + ":" + minutes + ":" + seconds;
};

export const getFullDateOf = (value: Date) => {
  const date = new Date(value);
  let day: any = date.getDate();
  let month: any = date.getMonth() + 1;
  const year = date.getFullYear();

  if (day < 10) day = "0" + day;
  if (month < 10) month = "0" + month;

  return day + "/" + month + "/" + year;
};

export const getFullToday = () => {
  return getFullDate() + " lúc " + getFullTime();
};

export const AFFIX_EMAIL = "@hutechcheckin.web.app";

export const SERVER_URL = import.meta.env.WITE_PUBLIC_SERVER_API_URL;
export const AUTH_API_URL = `${SERVER_URL}/v1/auth`;

export const FIREBASE_API_KEY = import.meta.env.WITE_PUBLIC_FIREBASE_API_KEY;
export const FIREBASE_AUTH_DOMAIN = import.meta.env
  .WITE_PUBLIC_FIREBASE_AUTH_DOMAIN;
export const FIREBASE_DATABASE_URL = import.meta.env
  .WITE_PUBLIC_FIREBASE_DATABASE_URL;
export const FIREBASE_PROJECT_ID = import.meta.env
  .WITE_PUBLIC_FIREBASE_PROJECT_ID;
export const FIREBASE_STORAGE_BUCKET = import.meta.env
  .WITE_PUBLIC_FIREBASE_STORAGE_BUCKET;
export const FIREBASE_MESSAGING_SENDER_ID = import.meta.env
  .WITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
export const FIREBASE_APP_ID = import.meta.env.WITE_PUBLIC_FIREBASE_APP_ID;
export const FIREBASE_MEASUREMENT_ID = import.meta.env
  .WITE_PUBLIC_FIREBASE_MEASUREMENT_ID;
