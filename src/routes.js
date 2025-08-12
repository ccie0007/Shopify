import React from 'react'

// Core pages
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const FtpConnections = React.lazy(() => import('./views/FtpConnections'))
const ShopifySettings = React.lazy(() => import('./views/ShopifySettings'))
const Settings = React.lazy(() => import('./views/settings/Settings'))
const HelpSupport = React.lazy(() => import('./views/help-support/HelpSupport'))


// Optional: Keep Colors & Typography if you still use them
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/shopify-ftp/ftp-connections', name: 'FTP Connections', element: FtpConnections },
  { path: '/shopify-ftp/shopify-settings', name: 'Shopify Settings', element: ShopifySettings },
  { path: '/settings', name: 'Settings', element: Settings },
  { path: '/shopify-ftp/help-support', name: 'Help / Support', element: HelpSupport },
]


export default routes
