import { IconHome, IconTable, IconUsersGroup } from '@tabler/icons-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { NavLink } from '@/props'
import { selectStudyClass } from '@/redux'

import classes from './layout-monitor.module.css'

export function Navbar() {
  const [path, setPath] = useState(
    window.location.href.split('/')[4]?.split('?')[0]
  )

  const studyClass = useSelector(selectStudyClass)

  const data = [
    { link: '', label: 'Trang chủ', icon: IconHome },
    {
      link: 'my-class',
      label: `Lớp học (${studyClass})`,
      icon: IconUsersGroup
    },
    { link: 'activities', label: `Thống kê hoạt động`, icon: IconTable }
  ]

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

  const links = data.map(link => <Links {...link} key={link.label} />)

  return <>{links}</>
}
