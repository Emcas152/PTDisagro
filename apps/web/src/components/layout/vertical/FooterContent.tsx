'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(
        verticalLayoutClasses.footerContent,
        'flex items-center justify-between flex-wrap gap-4 text-sm',
      )}
    >
      <p className='text-textSecondary'>
        <span>{`© ${new Date().getFullYear()} `}</span>
        <span className='font-semibold text-primary'>Disagro</span>
        <span>{` | Feria de Promociones Anual`}</span>
      </p>
      {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          <Link href='/' className='text-primary hover:underline'>
            Portal Feria
          </Link>
          <Link href='/login' className='text-primary hover:underline'>
            Acceso Administrativo
          </Link>
          <span className='text-textSecondary text-xs'>
            PBX Atención al Cliente: <strong>2223-2425</strong>
          </span>
        </div>
      )}
    </div>
  )
}

export default FooterContent
