import {
  ColorSwatch,
  Group,
  Loader,
  MultiSelectProps,
  Text
} from '@mantine/core'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/firebase'

export const MultiSelectLabel: MultiSelectProps['renderOption'] = ({
  option: label
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('')

  useEffect(() => {
    setIsLoading(true)
    findLabel(label.label)
  }, [])

  const findLabel = async (name: string) => {
    const docRef = query(collection(db, 'labels'), where('name', '==', name))
    const docsSnap = await getDocs(docRef)
    const docData = docsSnap.docs[0].data()

    setName(docData.name)
    setColor(docData.color)
    setIsLoading(false)
  }

  return (
    <>
      {isLoading ? (
        <Loader color="blue" />
      ) : (
        <Group gap="sm">
          <ColorSwatch color={color} />
          <Text size="sm">{name}</Text>
        </Group>
      )}
    </>
  )
}
