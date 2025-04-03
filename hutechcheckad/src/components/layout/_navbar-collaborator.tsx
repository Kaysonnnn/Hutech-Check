import { Text } from '@mantine/core'
import {
  IconCalendarEvent,
  IconCertificate,
  IconHome,
  IconIdBadge2,
  IconReport,
  IconUsers
} from '@tabler/icons-react'
import React, { useState } from 'react'

import { NavLink } from '@/props'

import classes from './layout.module.css'

const mainData = [{ link: '', label: 'Trang chủ', icon: IconHome }]
const dbData = [
  { link: 'events', label: 'Sự kiện', icon: IconCalendarEvent },
  { link: 'students', label: 'Sinh viên', icon: IconIdBadge2 },
  { link: 'monitors', label: 'Ban cán sự', icon: IconUsers },
  { link: 'certs', label: 'Chứng nhận', icon: IconCertificate }
]
const reportData = [
  { link: 'report', label: 'Danh sách SV tham gia', icon: IconReport }
]

export function NavbarCollaborator() {
  const [path, setPath] = useState(
    window.location.href.split('/')[4]?.split('?')[0]
  )

  const Links = ({ link, label, icon: Icon }: NavLink) => {
    return (
      <a
        className={classes.link}
        data-active={link === path || undefined}
        href={'/#/' + link}
        key={label}
        onClick={() => setPath(link)}
      >
        <Icon className={classes.linkIcon} stroke={1.5} />
        <span>{label}</span>
      </a>
    )
  }

  const mainLinks = mainData.map(link => <Links {...link} key={link.label} />)
  const dbLinks = dbData.map(link => <Links {...link} key={link.label} />)
  const reportLinks = reportData.map(link => (
    <Links {...link} key={link.label} />
  ))

  return (
    <>
      {mainLinks}

      <Text fw={700} my="sm">
        Dữ liệu
      </Text>
      {dbLinks}

      <Text fw={700} my="sm">
        Tra cứu
      </Text>
      {reportLinks}
    </>
  )
}
