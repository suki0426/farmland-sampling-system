import { isURL } from '@/utils/validate'

export function addDynamicMenuRoutes ({ router, mainRoutes, _import, menuList = [], routes = [] }) {
  let temp = []
  for (let i = 0; i < menuList.length; i++) {
    const menuItem = menuList[i]
    if (menuItem.children && menuItem.children.length >= 1) {
      temp = temp.concat(menuItem.children)
    }

    if (menuItem.href && /\S/.test(menuItem.href)) {
      const href = menuItem.href.replace(/[/]$/, '')
      const route = {
        path: href.split('?')[0],
        component: null,
        name: href.replace(/^\//g, '').replace(/[/]/g, '-').replace(/[?]/g, '-').replace(/&/g, '-').replace(/=/g, '-'),
        meta: {
          parentIds: menuItem.parentIds,
          menuId: menuItem.id,
          title: menuItem.name,
          isDynamic: true,
          type: menuItem.target,
          affix: menuItem.affix === '1',
          iframeUrl: ''
        }
      }
      // url以http[s]://开头, 通过iframe展示
      if (menuItem.target === 'iframe') {
        route.path = '/' + route.meta.menuId
        if (isURL(href)) {
          route['meta']['iframeUrl'] = href
        } else {
          route['meta']['iframeUrl'] = `${process.env.VUE_APP_SERVER_URL}${href}`
        }
      } else {
        try {
          if (href) {
            route['component'] = _import(`modules${href.split('?')[0]}`) || null
          }
        } catch (e) {
          console.log(e)
        }
      }
      let exist = routes.filter(r =>
        r.path === route.path
      ).length === 0 && mainRoutes.children.filter(c =>
        c.path === route.path
      ).length === 0
      if (exist) { // 如果路由不存在则添加
        routes.push(route)
      }
    }
  }
  if (temp.length >= 1) {
    addDynamicMenuRoutes({ router, mainRoutes, _import, menuList: temp, routes })
  } else {
    mainRoutes.name = 'main-dynamic'
    mainRoutes.children = routes
    router.addRoute(mainRoutes)
    router.addRoute({ path: '*', redirect: { name: '404' } })
    localStorage.setItem('dynamicMenuRoutes', JSON.stringify(mainRoutes.children || []))
  }
}
