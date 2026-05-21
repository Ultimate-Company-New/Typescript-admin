import type { SvgIconComponent } from '@mui/icons-material'
import type { SvgIconProps } from '@mui/material'
import type { Theme } from '@mui/material/styles'

/** Theme-aligned sidebar icon colors (MUI default light palette). */
export interface SidebarIconColors {
  users: string
  userGroups: string
  leads: string
  promos: string
  products: string
  packages: string
  pickupLocations: string
  purchaseOrders: string
  shipments: string
  messages: string
  webTemplates: string
  settings: string
  qaDashboard: string
  support: string
  developerDocs: string
  /** Shared color for all Add submenu items. */
  add: string
  /** Shared color for all Import submenu items. */
  import: string
}

/**
 * Resolves sidebar icon colors from the active MUI theme so icons match app chrome
 * (primary blue header, success green chips, info/warning accents).
 */
export const getSidebarIconColors = (theme: Theme): SidebarIconColors => ({
  users: theme.palette.primary.main,
  userGroups: theme.palette.secondary.main,
  leads: theme.palette.info.main,
  promos: theme.palette.success.main,
  products: theme.palette.warning.main,
  packages: theme.palette.primary.dark,
  pickupLocations: theme.palette.error.main,
  purchaseOrders: theme.palette.secondary.dark,
  shipments: theme.palette.info.dark,
  messages: theme.palette.primary.light,
  webTemplates: theme.palette.secondary.light,
  settings: theme.palette.text.secondary,
  qaDashboard: theme.palette.warning.dark,
  support: theme.palette.success.dark,
  developerDocs: theme.palette.info.dark,
  add: theme.palette.success.main,
  import: theme.palette.info.main,
})

interface ColoredSidebarIconProps {
  icon: SvgIconComponent
  color: string
  fontSize?: SvgIconProps['fontSize']
}

/** Renders a sidebar nav icon with an explicit theme color. */
export const ColoredSidebarIcon = ({
  icon: Icon,
  color,
  fontSize = 'medium',
}: ColoredSidebarIconProps): JSX.Element => <Icon fontSize={fontSize} sx={{ color }} />
