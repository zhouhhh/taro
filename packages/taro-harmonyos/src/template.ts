import { RecursiveTemplate, Shortcuts } from '@tarojs/shared'

export class Template extends RecursiveTemplate {
  Adapter = {
    if: 'if',
    else: 'else',
    elseif: 'elif',
    for: 'for',
    forItem: 'for-item',
    forIndex: 'for-index',
    key: 'key',
    type: 'harmonyos'
  }

  nativeComps = [
    'checkbox',
    'radio'
  ]

  usedNativeComps: string[] = []

  constructor () {
    super()
    this.voidElements.add('button')
    this.voidElements.add('image')
    this.voidElements.add('static-image')
  }

  buildHeaderTemplate = (componentConfig) => {
    if (componentConfig.includeAll) {
      this.usedNativeComps = [...this.nativeComps]
    } else {
      this.usedNativeComps = Array.from<string>(componentConfig.includes).filter(name => this.nativeComps.includes(name))
    }

    const elements = this.usedNativeComps.reduce((str, name) => str + `<element name="${name}" src="./components-harmony/${name}/index.hml"></element>\n`, '')

    return `<element name="container" src="./index.hml"></element>
${elements}

<block for="{{i in root.cn}}">
`
  }

  buildTemplate = (componentConfig) => {
    let template = this.buildHeaderTemplate(componentConfig)

    if (!this.miniComponents) {
      this.miniComponents = this.createMiniComponents(this.internalComponents)
    }
    const ZERO_FLOOR = 0
    const components = Object.keys(this.miniComponents)
      .filter(c => componentConfig.includes.size && !componentConfig.includeAll ? componentConfig.includes.has(c) : true)

    template = components.reduce((current, nodeName) => {
      const attributes = this.miniComponents[nodeName]
      return current + this.buildComponentTemplate({ nodeName, attributes }, ZERO_FLOOR)
    }, template)

    template += this.buildPlainTextTemplate()

    template += '\n</block>'

    return template
  }

  buildStandardComponentTemplate (comp) {
    const children = this.voidElements.has(comp.nodeName) ? '' : '<container root="{{i}}"></container>'

    let nodeName = ''
    switch (comp.nodeName) {
      case 'slot':
      case 'slot-view':
      case 'catch-view':
      case 'static-view':
      case 'pure-view':
      case 'view':
        nodeName = 'div'
        break
      case 'static-text':
        nodeName = 'text'
        break
      case 'static-image':
        nodeName = 'image'
        break
      default:
        nodeName = comp.nodeName
        break
    }

    const res = `
<block if="{{i.nn == '${comp.nodeName}'}}">
  <${nodeName} ${this.buildAttrs(comp.attributes, comp.nodeName)} id="{{i.uid}}">
    ${children}
  </${nodeName}>
</block>
`

    return res
  }

  buildPlainTextTemplate (): string {
    return `
<block if="{{i.nn === '#text'}}">
  <span>{{i.${Shortcuts.Text}}}</span>
</block>
`
  }

  buildAttrs (attrs, nodeName) {
    return Object.keys(attrs)
      .map(k => `${k}="${k.startsWith('bind') || k.startsWith('on') || k.startsWith('catch') ? attrs[k] : `{${this.getAttrValue(attrs[k], k, nodeName)}}`}" `)
      .join('')
  }

  replacePropName (name: string, value: string, _componentName?: string) {
    if (value === 'eh') return name.toLowerCase().replace(/^bind/, '@')
    return name
  }

  getEvents (): any {
    return {
      '@click': 'eh'
    }
  }

  buildPageTemplate = (baseTempPath: string) => {
    const template = `<element name="container" src="${baseTempPath.replace('base', 'container/index')}"></element>

<div class="container">
  <container root="{{root}}"></container>
</div>
`

    return template
  }
}
