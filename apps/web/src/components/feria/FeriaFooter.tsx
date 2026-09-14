'use client'

export default function FeriaFooter() {
  return (
    <footer className='bg-[#1f2428] text-gray-400 py-8 border-t border-gray-800 text-xs'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div>
          <span className='font-bold text-gray-200'>DISAGRO de Guatemala, S.A.</span>
          <p className='text-gray-500 mt-0.5'>
            Soluciones integrales de nutrición vegetal, protección de cultivos y tecnología.
          </p>
        </div>

        <div className='flex items-center space-x-6'>
          <div className='flex items-center space-x-1.5'>
            <i className='ri-customer-service-2-line text-emerald-400 text-base' />
            <span>PBX Servicio al Cliente:</span>
            <strong className='text-white'>2223-2425</strong>
          </div>
          <span className='text-gray-600'>|</span>
          <span>© {new Date().getFullYear()} Feria de Promociones</span>
        </div>
      </div>
    </footer>
  )
}
