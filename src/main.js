import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'vant/lib/index.css'

import { Button, NavBar, Tabbar, TabbarItem, Icon, ActionSheet, Cell, CellGroup, Overlay, Dialog, SwipeCell, Toast, Switch, Progress as VanProgress } from 'vant'

import Home from './views/Home.vue'
import DayLearn from './views/DayLearn.vue'
import Practice from './views/Practice.vue'
import Review from './views/Review.vue'
import WordBook from './views/WordBook.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/learn/:day', component: DayLearn, props: true },
  { path: '/practice/:day', component: Practice, props: true },
  { path: '/review', component: Review },
  { path: '/wordbook', component: WordBook }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(Button)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Icon)
app.use(ActionSheet)
app.use(Cell)
app.use(CellGroup)
app.use(Overlay)
app.use(Dialog)
app.use(SwipeCell)
app.use(Toast)
app.use(Switch)
app.use(VanProgress)
app.use(router)
app.use(createPinia())
app.mount('#app')
