import HarmonyOS from './program'

import type { IPluginContext } from '@tarojs/service'

// 让其它平台插件可以继承此平台
export { HarmonyOS }

export default (ctx: IPluginContext) => {
  ctx.registerPlatform({
    name: 'harmonyos',
    useConfigName: 'mini',
    async fn ({ config }) {
      const program = new HarmonyOS(ctx, config)
      await program.start()
    }
  })
}
