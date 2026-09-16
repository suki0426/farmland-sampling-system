import '@/directive'
import '@/utils/filter'
import { registerPlugins } from './plugins'
import { registerGlobalComponents } from './components'
import { registerGlobalProperties } from './prototypes'

export function bootstrapApp () {
  registerPlugins()
  registerGlobalComponents()
  registerGlobalProperties()
}
