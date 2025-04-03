export const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
export const phonePattern = /(0[3|5|7|8|9])+([0-9]{8})\b/;

export const isNumber = (value: any) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
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

export const getFullDateOf = (value: Date) => {
  const date = new Date(value);
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

export const getFullToday = () => {
  return getFullDate() + " lúc " + getFullTime();
};

export const formatCertNumber = (num: number, length: number): string => {
  let formatted = num.toString();
  while (formatted.length < length) {
    formatted = "0" + formatted;
  }
  return formatted;
};

export const getCefYear = (date: any) => {
  let cefYear: string;

  const mocNgay = 18;
  const mocThang = 7;

  const string = new Date(date);
  const ngay = string.getDate();
  const thang = string.getMonth() + 1;
  const nam = string.getFullYear().toString().slice(-2);

  if (ngay >= mocNgay && thang >= mocThang) {
    cefYear = `${nam}${Number(nam) + 1}`;
  } else {
    cefYear = `${Number(nam) - 1}${nam}`;
  }

  return cefYear;
};

export const AFFIX_EMAIL = "@hutechcheckin.web.app";

export const SERVER_URL = import.meta.env.WITE_PUBLIC_SERVER_API_URL;
export const CHECKIN_API_URL = `${SERVER_URL}/v1/checkin`;

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
