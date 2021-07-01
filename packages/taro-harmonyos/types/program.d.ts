import { TaroPlatformBase } from '@tarojs/service';
import { Template } from './template';
export default class HarmonyOS extends TaroPlatformBase {
    platform: string;
    globalObject: string;
    runtimePath: string;
    taroComponentsPath: string;
    fileType: {
        templ: string;
        style: string;
        config: string;
        script: string;
    };
    template: Template;
    /**
     * 1. setupTransaction - init
     * 2. setup
     * 3. setupTransaction - close
     * 4. buildTransaction - init
     * 5. build
     * 6. buildTransaction - close
     */
    constructor(ctx: any, config: any);
    /**
     * 增加组件或修改组件属性
     */
    modifyComponents(): void;
    /**
     * 不需要转 rpx
     */
    modifyPostcssConfigs(config: Record<string, any>): void;
    /**
     * 模板自定义组件 js
     * 等鸿蒙支持 template 后需要重构
     */
    addEntry(): void;
    /**
     * 把 app、pages、自定义组件的 js 改造为鸿蒙的 export default 导出形式
     */
    modifyTaroExport(): void;
    /**
     * 修改最终的编译产物
     * 1. 生成模板自定义组件的 xml、css 文件
     * 2. 删除多余的文件
     * 3. 把 components-harmony 中被使用到的组件移动到输出目录
     */
    modifyBuildAssets(ctx: any, config: any): void;
    modifyWebpackConfig(): void;
}
