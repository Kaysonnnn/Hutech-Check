import { Loader, Text } from '@mantine/core'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const HostNameCol = ({ hostId }: { hostId: string }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [hostName, setHostName] = useState('')

  useEffect(() => {
    if (hostId !== '') {
      setIsLoading(true)
      findHost(hostId)
    }
  }, [])

  const findHost = async (hostId: string) => {
    const docRef = doc(db, 'hosts', hostId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const docData = docSnap.data()
      setHostName(docData.name)
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading ? (
        <Loader color="#fff" size="xs" mr="xs" />
      ) : hostName === '' ? (
        <Text c="red" fw={700}>
          Trống...
        </Text>
      ) : (
        hostName
      )}
    </>
  )
}
