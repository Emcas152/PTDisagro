// Component Imports
import Login from '@views/Login'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const RootLoginPage = () => {
  // Vars
  const mode = getServerMode()

  return <Login mode={mode} />
}

export default RootLoginPage
