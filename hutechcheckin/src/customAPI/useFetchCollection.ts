import {
  OrderByDirection,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/firebase/config";
import { ref, watchEffect } from "kdu";
import { showToast } from "@/utils/Toast";

/**
 * Fetches a collection from Firestore and returns the data and loading state.
 *
 * @param collectionName The collection to fetch.
 * @param sortBy The field to sort by.
 * @param direction Optional direction to sort by ('asc' or 'desc'). If not specified, order will be ascending.
 */
const useFetchCollection = (
  collectionName: any,
  sortBy: string | undefined = "createdAt",
  direction: OrderByDirection | undefined = "desc"
) => {
  let data = ref([]);
  let isLoading = ref(false);

  const getCollection = () => {
    isLoading.value = true;
    try {
      const docRef = collection(db, collectionName);
      const q = query(docRef, orderBy(sortBy, direction));
      onSnapshot(q, (snapshot) => {
        const allData: any = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.value = allData;
        isLoading.value = false;
      });
    } catch (error: any) {
      isLoading.value = false;
      showToast(`Lỗi: ${error.message}`, "long");
    }
  };

  watchEffect(() => {
    getCollection();
  });

  return { data, isLoading };
};

export default useFetchCollection;
