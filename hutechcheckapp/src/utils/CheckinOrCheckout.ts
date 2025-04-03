import { CHECKIN_API_URL, formatCertNumber, getCefYear } from "@/const";
import { db } from "@/firebase/config";
import axios from "axios";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { showToast } from "./Toast";

const getStudentIdPattern = async () => {
  const configRef = doc(db, "system", "configuration");
  const configSnap = await getDoc(configRef);

  if (configSnap.exists()) {
    const configData = configSnap.data();
    return configData.regexCheckStudentId;
  } else {
    return "";
  }
};

const checkStudentId = async (studentId: string) => {
  const studentIdPattern = await getStudentIdPattern();

  if (studentIdPattern != "") {
    return new RegExp(studentIdPattern.slice(1, -1)).test(studentId);
  } else {
    return true;
  }
};

const checkExistStudentId = async (studentId: string) => {
  const docRef = doc(db, "students", studentId);
  const docSnap = await getDoc(docRef);

  return docSnap.exists();
};

/**
 * Hàm kiểm tra sinh viên đã checkin hay chưa
 *
 * @param eventId mã id sự kiện
 * @param studentId mã số sinh viên
 * @returns 0: chưa checkin, 1: đã checkin, 2: đã checkout
 */
const checkStudentCheckedIn = async (eventId: string, studentId: string) => {
  const docRef = doc(db, "certs", `${eventId}_${studentId}`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const docData = docSnap.data();
    const isCheckedOut = docData.checkoutAt;

    if (isCheckedOut === "") {
      return 1;
    } else if (isCheckedOut !== "") {
      return 2;
    }
  } else {
    return 0;
  }
};

const getCertSuffix = async (hostId: string) => {
  const docSnap = await getDoc(doc(db, "hosts", hostId));

  if (docSnap.exists()) {
    return `CN${getCefYear(new Date())}${docSnap.data().symbol}`;
  }
  return "";
};

const getCertId = async (suffix: string) => {
  const docsRef = query(collection(db, "certs"), where("suffix", "==", suffix));
  const docSnap = await getDocs(docsRef);
  return formatCertNumber(docSnap.size + 1, 6);
};

const handleCheckin = async (
  eventId: string,
  eventName: string,
  hostId: string,
  studentId: string,
  checkinBy: string
) => {
  const existStudentId = await checkExistStudentId(studentId);
  if (!existStudentId) {
    await setDoc(doc(db, "students", studentId), {
      studentId: studentId,
      fullName: "",
      studyClass: "",
      isMonitor: false,
      email: "",
      phone: "",
      createdAt: Timestamp.now().toDate(),
    });
  }

  const certSuffix = await getCertSuffix(hostId);

  const certId = await getCertId(certSuffix);

  console.log(`${certId}/${certSuffix}`);

  await setDoc(doc(db, "certs", `${eventId}_${studentId}`), {
    certId: `${certId}/${certSuffix}`,
    suffix: certSuffix,
    studentId: studentId,
    eventId: eventId,
    checkinAt: Timestamp.now().toDate(),
    checkinBy: checkinBy,
    checkoutAt: "",
  });

  const configRef = doc(db, "system", "configuration");
  const configSnap = await getDoc(configRef);
  if (configSnap.exists()) {
    if (configSnap.data().isEmailNotify) {
      await axios.post(
        `${CHECKIN_API_URL}/thank-you`,
        {
          eventName: eventName,
          studentId: studentId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }
};

const handleCheckout = async (eventId: string, studentId: string) => {
  await updateDoc(doc(db, "certs", `${eventId}_${studentId}`), {
    checkoutAt: Timestamp.now().toDate(),
  });
};

const handleCheckinAgain = async (eventId: string, studentId: string) => {
  await updateDoc(doc(db, "certs", `${eventId}_${studentId}`), {
    checkoutAt: "",
  });
};

export const onCheckinOrCheckout = async (
  eventId: string,
  eventName: string,
  hostId: string,
  studentId: string,
  checkinBy: string
) => {
  let succeeded: boolean = false;

  const validStudentId = await checkStudentId(studentId);

  if (validStudentId) {
    const state = await checkStudentCheckedIn(eventId, studentId);

    if (state === 0) {
      handleCheckin(eventId, eventName, hostId, studentId, checkinBy);
      showToast(`Check-in sinh viên ${studentId} thành công.`);
      succeeded = true;
    } else if (state === 1) {
      handleCheckout(eventId, studentId);
      showToast(`Check-out sinh viên ${studentId} thành công.`);
      succeeded = true;
    } else if (state === 2) {
      handleCheckinAgain(eventId, studentId);
      showToast(
        `Đã check-in sinh viên ${studentId} tham dự lại sự kiện (Hủy check-out).`
      );
      succeeded = true;
    } else {
      succeeded = false;
    }
  } else {
    showToast("Mã số sinh viên không hợp lệ.");
    succeeded = false;
  }

  return { succeeded };
};
