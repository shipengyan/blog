import './assets/js/base'
import { app, router, store } from './main'
import clientGoogleAnalyse from './utils/clientGoogleAnalyse'

// SSR can not render hash since browsers even don't send it
// therefore we must hydrate the hash for the client side vue-router,
// which is important for hash anchor jump especially for Table Of Contents(toc)
window.__INITIAL_STATE__.route.hash = window.location.hash
store.replaceState(window.__INITIAL_STATE__)

app.$mount('#app')

router.beforeEach((to, from, next) => {
  // required by a new hash, just navigate to it
  if (to.path === from.path && to.hash !== from.hash) {
    return next()
  }

  let loadingPromise = store.dispatch('START_LOADING')
  let endLoadingCallback = (path) => {
    return loadingPromise.then(interval => {
      clearInterval(interval)
      store.dispatch('SET_PROGRESS', 100)
      next(path)
    })
  }

  let component = router.getMatchedComponents(to.fullPath)[0]
  // there must be a matched component according
  // to routes definition
  if (component.preFetch) {
    // component need fetching some data before navigating to it
    return component.preFetch(store, to, endLoadingCallback).catch(err => {
      console.error(Date.now().toLocaleString(), err)
    })
  } else {
    // component's a static page and just navigate to it
    endLoadingCallback()
  }
})

// send user info if google analytics code is provided.
if (window.__INITIAL_STATE__.siteInfo) {
  let analyzeCode = window.__INITIAL_STATE__.siteInfo.analyzeCode
  if (analyzeCode && analyzeCode.value !== '') {
    router.afterEach(route => {
      clientGoogleAnalyse(route.path)
    })
  }
}
