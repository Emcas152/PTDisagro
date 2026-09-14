// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { api } from '@/services/api'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({
  scrollMenu,
}: {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}) => {
  // Hooks
  const theme = useTheme()
  const router = useRouter()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: (container) => scrollMenu(container, false),
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: (container) => scrollMenu(container, true),
          })}
    >
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => (
          <RenderExpandIcon open={open} transitionDuration={transitionDuration} />
        )}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        <MenuSection label='Feria Disagro 2026'>
          <MenuItem href='/dashboard' icon={<i className='ri-dashboard-line' />}>
            Dashboard General
          </MenuItem>
          <MenuItem href='/registros' icon={<i className='ri-user-follow-line' />}>
            Participantes y Registros
          </MenuItem>
          <MenuItem href='/catalogo' icon={<i className='ri-store-2-line' />}>
            Catálogo (Servicios/Prod)
          </MenuItem>
          <MenuItem href='/eventos' icon={<i className='ri-calendar-event-line' />}>
            Configuración Evento
          </MenuItem>
        </MenuSection>

        <MenuSection label='Portal Público'>
          <MenuItem
            href='/feria'
            icon={<i className='ri-external-link-line' />}
            target='_blank'
          >
            Ver Formulario Clientes
          </MenuItem>
        </MenuSection>

        <MenuSection label='Sesión'>
          <MenuItem
            onClick={async (e) => {
              e?.preventDefault?.()
              try {
                await api.logout()
              } catch (err) {
                console.error('Error during logout:', err)
              } finally {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('disagro_token')
                  localStorage.removeItem('disagro_user')
                  window.location.href = '/'
                }
              }
            }}
            icon={<i className='ri-logout-box-r-line' />}
          >
            Cerrar Sesión
          </MenuItem>
        </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
