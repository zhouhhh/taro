import { internalComponents } from '@tarojs/shared'
import { initNativeApi } from './apis'

export { initNativeApi }
export * from './components'
export const hostConfig = {
  initNativeApi,
  modifyDispatchEvent (event, tagName) {
    const comps = Object.keys(internalComponents).map(c => c.toLowerCase())
    tagName = tagName.toLowerCase()
    if (event.type === 'click' && comps.includes(tagName)) {
      event.type = 'tap'
    }
  }
}
