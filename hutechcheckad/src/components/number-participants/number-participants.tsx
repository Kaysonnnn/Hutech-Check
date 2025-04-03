import { Badge, Loader } from '@mantine/core'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const NumberParticipants = ({ docId }: { docId: string }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [checkinLength, setCheckinLength] = useState<number>(0)
  const [checkoutLength, setCheckoutLength] = useState<number>(0)

  useEffect(() => {
    setIsLoading(true)
    getEventCheckin()
  }, [])

  const getEventCheckin = async () => {
    const docsRef = query(
      collection(db, 'certs'),
      where('eventId', '==', docId)
    )
    const docsSnap = await getDocs(docsRef)

    setCheckinLength(docsSnap.size)
    let checkoutLen = 0

    docsSnap.forEach((doc: any) => {
      const docData = doc.data()
      if (docData.checkoutAt !== '') {
        checkoutLen++
      }
    })

    setCheckoutLength(checkoutLen)
    setIsLoading(false)
  }

  return (
    <>
      {isLoading ? (
        <Loader color="blue" size="xs" mr="xs" />
      ) : (
        <>
          <Badge color="blue" radius="xs">
            {checkinLength}
          </Badge>{' '}
          <Badge color="red" radius="xs">
            {checkoutLength}
          </Badge>
        </>
      )}
    </>
  )
}
