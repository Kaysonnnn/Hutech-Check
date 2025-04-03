import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const useFetchDocument = (collectionName: any, documentID: any) => {
  const [document, setDocument] = useState(null)

  const getDocument = async () => {
    const docRef = doc(db, collectionName, documentID)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const obj: any = {
        id: documentID,
        ...docSnap.data()
      }
      setDocument(obj)
    } else {
      window.SweetAlert.error('Lỗi dữ liệu', 'Không tìm thấy dữ liệu', false)
    }
  }

  useEffect(() => {
    getDocument()
  }, [])

  return { document }
}
