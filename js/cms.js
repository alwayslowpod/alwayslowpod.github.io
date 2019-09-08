window.cms = {
    util: {
        pluck(array, key) {
            if ( !Array.isArray(array) ) array = Object.values(array)
            return array.map(o => o[key]);
        },
        flatten(arr) {
            return arr.reduce((flat, to_flatten) => {
                return flat.concat(Array.isArray(to_flatten) ? this.flatten(to_flatten) : to_flatten)
            }, [])
        },
        unique(arr){
            const returns = []
            arr.forEach((elem) => {
                if ( !returns.includes(elem) ) returns.push(elem)
            })
            return returns
        },
    },
    params: {},
    async templates(target = 'html'){
        const $targets = $(target).find('.cms-template')
        const targets = []
        $targets.each((k, t) => targets.push(t))
        // if ( !Array.isArray(targets) ){ console.log('not array ', targets); return; }
        for ( const key in targets ){
            if ( !targets.hasOwnProperty(key) ) continue
            const $item = $(targets[key])
            if ( $item.attr('data-cms-template') ){
                await this.load($item, $item.attr('data-cms-template'))
                await this.templates(targets[key]) // for any nested templates
            }
        }
    },
    load($target, template){
        return new Promise((resolve, reject) => {
            $target.load(`/templates/${template}.template.html`, () => resolve())
        })
    },
    inject(){
        $('.cms-iterate').each((key, item) => {
            const $item = $(item)
            if ( !$item.attr('cms-data-complete') ) {
                const iterate_item = $item.attr('data-cms-iterate')
                let items = this.stream.resolve(iterate_item)

                if ( $item.attr('data-cms-iterate-limit') ){
                    const keys = Object.keys(items).slice(0, parseInt($item.attr('data-cms-iterate-limit')))
                    const new_items = {}
                    keys.reverse().forEach((key) => new_items[key] = items[key])
                    items = new_items
                }

                Object.keys(items).forEach((k) => {
                    const iterate = items[k]
                    const $node = $item.clone()
                    $node.attr('data-cms-complete', true)
                    $node.find('.cms-item').each((key, subitem) => {
                        const $subitem = $(subitem)
                        if (!$subitem.attr('data-cms-complete')) {
                            if ($subitem.attr('data-cms-item') === '$iterate') {
                                $subitem.html(iterate)
                                $subitem.attr('data-cms-complete', true)
                            }
                            else if ( $subitem.attr('data-cms-item').startsWith('$iterate.') ){
                                const parts = $subitem.attr('data-cms-item').split('.').slice(1)
                                let current = iterate
                                parts.forEach((part) => {
                                    if ( Object.keys(current).includes(part) ) current = current[part]
                                })

                                $subitem.html(current)
                                $subitem.attr('data-cms-complete', true)
                            }
                            // TODO if iterate in middle
                            // TODO if no iterate, then just resolve
                        }
                    })

                    $node.find('[class*="cms-attr"]').each((key, subitem) => {
                        const $subitem = $(subitem)
                        if (!$subitem.attr('data-cms-attr-complete')){
                            const classes = $subitem.attr("class").split(/\s+/)
                            classes.forEach((classname) => {
                                if (classname.startsWith('cms-attr')) {
                                    const attr_name = classname.replace('cms-attr-', '')
                                    const data_key = $subitem.attr(`data-${classname}`)

                                    if ( data_key === '$iterate' ){
                                        $subitem.attr(attr_name, iterate)
                                    }
                                    else if ( data_key.startsWith('$iterate.') ){
                                        const parts = data_key.split('.').splice(1)
                                        let current = iterate
                                        parts.forEach((part) => {
                                            if ( Object.keys(current).includes(part) ) current = current[part]
                                        })

                                        $subitem.attr(attr_name, current)
                                    }
                                }
                            })

                            $subitem.attr('data-cms-attr-complete', true)
                        }
                    })

                    $node.insertAfter($item)
                })

                $item.remove()
            }
        })

        $('.cms-item').each((key, item) => {
            const $item = $(item)
            if ( !$item.attr('data-cms-complete') ){
                const data_key = $item.attr('data-cms-item')
                const data = this.stream.resolve(data_key)
                $item.html(data)

                $item.attr('data-cms-complete', true)
            }
        })

        $('[class*="cms-attr"]').each((key, item) => {
            const $item = $(item)
            if ( !$item.attr('data-cms-attr-complete') ) {
                const classes = $item.attr("class").split(/\s+/)
                classes.forEach((classname) => {
                    if (classname.startsWith('cms-attr')) {
                        const attr_name = classname.replace('cms-attr-', '')
                        const data_key = $item.attr(`data-${classname}`)
                        const data = this.stream.resolve(data_key)
                        $item.attr(attr_name, data)
                    }
                })

                $item.attr('data-cms-attr-complete', true)
            }
        })
    },
    parse(){
        const params = new URLSearchParams(window.location.search)
        const stream_key = params.get('st')
        if ( stream_key ){
            this.params.stream = this.stream.streams[stream_key]

            const subject_key = params.get('sb')
            if ( subject_key ){
                this.params.subject = this.stream.resolve(`${stream_key}.${subject_key}`)
            }
        }

        const index_key = params.get('i')
        if ( index_key ){
            this.params.index = this.stream.indices[index_key]
        }
    },
    async render(){
        this.parse()
        await this.templates()
        this.inject()
    },
    stream: {
        streams: {},
        indices: {},
        register(name, stream){
            Object.keys(stream).forEach((key) => stream[key]['@id'] = key)
            this.streams[name] = stream
        },
        index(name, values){
            this.indices[name] = values
        },
        resolve(key){
            const key_parts = key.split('.')

            let current = this.streams ? this.streams : false
            let string = ''
            key_parts.forEach((part) => {
                let skip = false
                if ( part.startsWith('$latest') ){
                    const resolution_ops = part.split('-')
                    if ( resolution_ops.length === 1 ) part = Object.keys(current)[0]
                    else if ( Object.keys(current).length >= parseInt(resolution_ops[1]) ) part = Object.keys(current)[(parseInt(resolution_ops[1]))]
                }
                else if ( part.startsWith('#') ){
                    current = this.indices[part.replace('#', '')]
                    skip = true
                }
                else if ( part.startsWith('?') ){
                    current = cms.params[part.replace('?', '')]
                    skip = true
                }
                else if ( part.startsWith('{') ){
                    if ( current !== this.streams ) string = toString(current)
                    string = string + part.slice(1, -1)
                    skip = true
                }

                if ( current && !skip ){
                    if ( Object.keys(current).includes(part) ){
                        current = current[part]
                    }
                    else current = false
                }
            })

            if ( string.length > 0 ) return (current === this.streams) ? string : string+current
            return current
        },
        accrue(stream_name, key, limit = false){
            const stream = this.streams[stream_name]
            let returns = cms.util.unique(cms.util.flatten(cms.util.pluck(stream, key)))
            if ( limit ) returns = returns.slice(0, limit)
            return returns
        },
    },
}