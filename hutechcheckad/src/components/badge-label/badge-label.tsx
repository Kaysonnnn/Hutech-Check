import { Badge, Loader } from '@mantine/core'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const BadgeLabel = ({ label }: { label: string }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [labelName, setLabelName] = useState('')
  const [labelColor, setLabelColor] = useState('')

  useEffect(() => {
    setIsLoading(true)
    findLabel(label)
  }, [])

  const findLabel = async (labelId: string) => {
    const docRef = doc(db, 'labels', labelId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const docData = docSnap.data()
      setLabelName(docData.name)
      setLabelColor(docData.color)
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading ? (
        <Loader color="blue" size="xs" mr="xs" />
      ) : (
        <Badge color={labelColor} mr="xs">
          {labelName}
        </Badge>
      )}
    </>
  )
}
