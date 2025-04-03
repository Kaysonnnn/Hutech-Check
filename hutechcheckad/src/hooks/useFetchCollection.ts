import {
  collection,
  onSnapshot,
  orderBy,
  OrderByDirection,
  query
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

/**
 * @param collectionName The collection to fetch.
 * @param sortBy The field to sort by.
 * @param direction Optional direction to sort by ('asc' or 'desc'). If not specified, order will be ascending.
 */
export const useFetchCollection = (
  collectionName: any,
  sortBy: string | undefined = 'createdAt',
  direction: OrderByDirection | undefined = 'desc'
) => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const getCollection = () => {
    setIsLoading(true)
    try {
      const docRef = collection(db, collectionName)
      const q = query(docRef, orderBy(sortBy, direction))
      onSnapshot(q, snapshot => {
        const allData: any = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setData(allData)
        setIsLoading(false)
      })
    } catch (error: any) {
      setIsLoading(false)
      window.SweetAlert.error(
        'Lỗi dữ liệu',
        `Không thể lấy dữ liệu: ${error.message}`,
        false
      )
    }
  }

  useEffect(() => {
    getCollection()
  }, [])

  return { data, isLoading }
}
