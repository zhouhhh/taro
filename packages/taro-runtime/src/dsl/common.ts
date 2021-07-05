/* eslint-disable dot-notation */
import { isFunction, EMPTY_OBJ, ensure, isUndefined, isArray } from '@tarojs/shared'
import { eventHandler } from '../dom/event'
import { Current } from '../current'
import { document } from '../bom/document'
import { TaroRootElement } from '../dom/root'
import { MpInstance } from '../hydrate'
import { Instance, PageInstance, PageProps } from './instance'
import { incrementId } from '../utils'
import { perf } from '../perf'
import { PAGE_INIT } from '../constants'
import { isBrowser } from '../env'
import { eventCenter } from '../emitter/emitter'
import { raf } from '../bom/raf'
import { CurrentReconciler } from '../reconciler'

import type { PageConfig } from '@tarojs/taro'
import type { Func } from '../utils/types'

const instances = new Map<string, Instance>()

export function injectPageInstance (inst: Instance<PageProps>, id: string) {
  CurrentReconciler.mergePageInstance?.(instances.get(id), inst)
  instances.set(id, inst)
}

export function getPageInstance (id: string) {
  return instances.get(id)
}

export function addLeadingSlash (path?: string) {
  if (path == null) {
    return ''
  }
  return path.charAt(0) === '/' ? path : '/' + path
}

const pageId = incrementId()

export function safeExecute (path: string, lifecycle: keyof PageInstance, ...args: unknown[]) {
  const instance = instances.get(path)

  if (instance == null) {
    return
  }

  const func = CurrentReconciler.getLifecyle(instance, lifecycle)

  if (isArray(func)) {
    const res = func.map(fn => fn.apply(instance, args))
    return res[0]
  }

  if (!isFunction(func)) {
    return
  }

  return func.apply(instance, args)
}

export function stringify (obj?: Record<string, unknown>) {
  if (obj == null) {
    return ''
  }
  const path = Object.keys(obj).map((key) => {
    return key + '=' + obj[key]
  }).join('&')
  return path === '' ? path : '?' + path
}

export function getPath (id: string, options?: Record<string, unknown>): string {
  let path = id
  if (!isBrowser) {
    path = id + stringify(options)
  }
  return path
}

export function getOnReadyEventKey (path: string) {
  return path + '.' + 'onReady'
}

export function getOnShowEventKey (path: string) {
  return path + '.' + 'onShow'
}

export function getOnHideEventKey (path: string) {
  return path + '.' + 'onHide'
}

export function createPageConfig (component: any, pageName?: string, data?: Record<string, unknown>, pageConfig?: PageConfig) {
  const id = pageName ?? `taro_page_${pageId()}`
  // 小程序 Page 构造器是一个傲娇小公主，不能把复杂的对象挂载到参数上
  let pageElement: TaroRootElement | null = null

  let unmounting = false
  let prepareMountList: (() => void)[] = []

  const config: PageInstance = {
    onInit (this: MpInstance, options = {}, cb?: Func) {
      perf.start(PAGE_INIT)

      Current.page = this as any
      this.config = pageConfig || {}
      options.$taroTimestamp = Date.now()

      Object.keys((this as any)._data).forEach(key => {
        if (!/^root\b/.test(key) && !/^\$i18n\b/.test(key)) {
          options[key] = (this as any)._data[key]
        }
      })

      // this.$taroPath 是页面唯一标识，不可变，因此页面参数 options 也不可变
      this.$taroPath = getPath(id, options)
      // this.$taroParams 作为暴露给开发者的页面参数对象，可以被随意修改
      if (this.$taroParams == null) {
        this.$taroParams = Object.assign({}, options)
      }

      const router = this.$taroPath
      Current.router = {
        params: this.$taroParams,
        path: addLeadingSlash(router),
        onReady: getOnReadyEventKey(id),
        onShow: getOnShowEventKey(id),
        onHide: getOnHideEventKey(id)
      }

      const mount = () => {
        Current.app!.mount!(component, this.$taroPath, () => {
          pageElement = document.getElementById<TaroRootElement>(this.$taroPath)

          ensure(pageElement !== null, '没有找到页面实例。')
          safeExecute(this.$taroPath, 'onLoad', this.$taroParams)
          if (!isBrowser) {
            pageElement.ctx = this
            pageElement.performUpdate(true, cb)
          }
        })
      }
      if (unmounting) {
        prepareMountList.push(mount)
      } else {
        mount()
      }
    },
    onReady () {
      raf(() => {
        eventCenter.trigger(getOnReadyEventKey(id))
      })

      safeExecute(this.$taroPath, 'onReady')
      this.onReady.called = true
    },
    onDestroy () {
      unmounting = true
      Current.app!.unmount!(this.$taroPath, () => {
        unmounting = false
        instances.delete(this.$taroPath)
        if (pageElement) {
          pageElement.ctx = null
        }
        if (prepareMountList.length) {
          prepareMountList.forEach(fn => fn())
          prepareMountList = []
        }
      })
    },
    onShow () {
      Current.page = this as any
      this.config = pageConfig || {}
      const router = this.$taroPath
      Current.router = {
        params: this.$taroParams,
        path: addLeadingSlash(router),
        onReady: getOnReadyEventKey(id),
        onShow: getOnShowEventKey(id),
        onHide: getOnHideEventKey(id)
      }

      raf(() => {
        eventCenter.trigger(getOnShowEventKey(id))
      })

      safeExecute(this.$taroPath, 'onShow')
    },
    onHide () {
      Current.page = null
      Current.router = null
      safeExecute(this.$taroPath, 'onHide')
      eventCenter.trigger(getOnHideEventKey(id))
    },
    onActive () {
      return safeExecute(this.$taroPath, 'onActive')
    },
    onInactive () {
      return safeExecute(this.$taroPath, 'onInactive')
    },
    onBackPress () {
      return safeExecute(this.$taroPath, 'onBackPress')
    },
    onNewRequest () {
      return safeExecute(this.$taroPath, 'onNewRequest')
    },
    onStartContinuation () {
      return safeExecute(this.$taroPath, 'onStartContinuation')
    },
    onSaveData () {
      return safeExecute(this.$taroPath, 'onSaveData')
    },
    onRestoreData () {
      return safeExecute(this.$taroPath, 'onRestoreData')
    },
    onCompleteContinuation () {
      return safeExecute(this.$taroPath, 'onCompleteContinuation')
    }
  }

  config.eh = eventHandler

  if (!isUndefined(data)) {
    config.data = data
  }

  if (isBrowser) {
    config.path = id
  }

  return config
}

export function createComponentConfig (component: React.ComponentClass, componentName?: string, data?: Record<string, unknown>) {
  const id = componentName ?? `taro_component_${pageId()}`
  let componentElement: TaroRootElement | null = null

  const config: any = {
    attached () {
      perf.start(PAGE_INIT)
      const path = getPath(id, { id: this.getPageId() })
      Current.app!.mount!(component, path, () => {
        componentElement = document.getElementById<TaroRootElement>(path)
        ensure(componentElement !== null, '没有找到组件实例。')
        safeExecute(path, 'onLoad')
        if (!isBrowser) {
          componentElement.ctx = this
          componentElement.performUpdate(true)
        }
      })
    },
    detached () {
      const path = getPath(id, { id: this.getPageId() })
      Current.app!.unmount!(path, () => {
        instances.delete(path)
        if (componentElement) {
          componentElement.ctx = null
        }
      })
    },
    pageLifetimes: {
      show () {
        safeExecute(id, 'onShow')
      },
      hide () {
        safeExecute(id, 'onHide')
      }
    },
    methods: {
      eh: eventHandler
    }
  }
  if (!isUndefined(data)) {
    config.data = data
  }

  config['options'] = component?.['options'] ?? EMPTY_OBJ
  config['externalClasses'] = component?.['externalClasses'] ?? EMPTY_OBJ
  config['behaviors'] = component?.['behaviors'] ?? EMPTY_OBJ
  return config
}

export function createRecursiveComponentConfig () {
  return {
    props: ['root'],
    eh: eventHandler
  }
}
