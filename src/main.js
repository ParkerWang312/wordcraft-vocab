import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'vant/lib/index.css'

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
app.use(router)
app.use(createPinia())
app.mount('#app')
