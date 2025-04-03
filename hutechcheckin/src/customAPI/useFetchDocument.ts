import { db } from "@/firebase/config";
import { showToast } from "@/utils/Toast";
import { doc, getDoc } from "firebase/firestore";
import { ref, watchEffect } from "kdu";

const useFetchDocument = (collectionName: string, documentId: string) => {
  const document = ref(null);

  const getDocument = async () => {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const obj: any = {
        id: documentId,
        ...docSnap.data(),
      };
      document.value = obj;
    } else {
      showToast(`Không tìm thấy data cho id: ${documentId}.`);
    }
  };

  watchEffect(() => {
    getDocument();
  });

  return { document };
};

export default useFetchDocument;
