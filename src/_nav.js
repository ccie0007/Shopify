import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilFolder } from '@coreui/icons'

import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // Your existing Theme, Components, etc sections remain unchanged here...

  // Grouped Shopify FTP App Section
  {
    component: CNavGroup,
    name: 'Shopify FTP',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'FTP Connections',
        to: '/shopify-ftp/ftp-connections',
        icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Shopify Settings',
        to: '/shopify-ftp/shopify-settings',
        icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Settings',
        to: '/settings', // Make sure this matches your route path!
        icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Help / Support',
        to: '/shopify-ftp/help-support',
        icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
      },
    ],
  },
]

export default _nav
