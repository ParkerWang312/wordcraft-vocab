import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'vant/lib/index.css'

import { Button, NavBar, Tabbar, TabbarItem, Icon, ActionSheet, Cell, CellGroup, Overlay, Dialog, SwipeCell, Toast, Switch, Field, Popup, Progress as VanProgress, Stepper, Empty } from 'vant'

import Home from './views/Home.vue'
import DayLearn from './views/DayLearn.vue'
import Practice from './views/Practice.vue'
import Review from './views/Review.vue'
import WordBook from './views/WordBook.vue'
import WordBookList from './views/WordBookList.vue'
import WordBookDetail from './views/WordBookDetail.vue'
import WordBookPractice from './views/WordBookPractice.vue'
import WordBookSettings from './views/WordBookSettings.vue'
import WordBookDictation from './views/WordBookDictation.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/learn/:unit', component: DayLearn, props: true },
  { path: '/practice/:unit', component: Practice, props: true },
  { path: '/review', component: Review },
  { path: '/wordbook', component: WordBook },
  { path: '/wordbooks', component: WordBookList },
  { path: '/wordbook/:id', component: WordBookDetail },
  { path: '/wordbook/:id/practice', component: WordBookPractice },
  { path: '/wordbook/:id/settings', component: WordBookSettings },
  { path: '/wordbook/:id/dictation', component: WordBookDictation }
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
app.use(Field)
app.use(Popup)
app.use(VanProgress)
app.use(Stepper)
app.use(Empty)
app.use(router)
app.use(createPinia())
app.mount('#app')
