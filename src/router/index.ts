import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import AppShell from '@/components/layout/AppShell.vue'
import AboutView from '@/views/AboutView.vue'
import BlogView from '@/views/BlogView.vue'
import FragmentComposeView from '@/views/FragmentComposeView.vue'
import FragmentsView from '@/views/FragmentsView.vue'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import ProjectDetailView from '@/views/ProjectDetailView.vue'
import ProjectNotesView from '@/views/ProjectNotesView.vue'
import FriendsApplyView from '@/views/FriendsApplyView.vue'
import FriendsView from '@/views/FriendsView.vue'
import MessagesView from '@/views/MessagesView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import RecommendView from '@/views/RecommendView.vue'
import { syncPageCorruptForRoute } from '@/theme/pageCorruptState'
import { applyPagePhotoBackgroundToDocument } from '@/theme/pagePhotoBackgrounds'

const routerHistory =
  import.meta.env.VITE_ROUTER_HISTORY === 'hash'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history: routerHistory,
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        { path: '', name: 'home', component: HomeView, meta: { appMainLayout: 'full-viewport' } },
        { path: 'projects', name: 'projects', component: ProjectsView },
        { path: 'projects/:slug', name: 'project-detail', component: ProjectDetailView },
        { path: 'projects/:slug/notes', name: 'project-notes', component: ProjectNotesView },
        { path: 'blog', name: 'blog', component: BlogView },
        { path: 'blog/:slug', name: 'post-detail', component: PostDetailView },
        { path: 'messages', name: 'messages', component: MessagesView },
        { path: 'friends', name: 'friends', component: FriendsView },
        { path: 'friends/apply', name: 'friends-apply', component: FriendsApplyView },
        {
          path: 'fragments',
          name: 'fragments',
          component: FragmentsView,
          meta: { appMainLayout: 'full-viewport' },
        },
        {
          path: 'fragments/compose',
          name: 'fragments-compose',
          component: FragmentComposeView,
          meta: { appMainLayout: 'full-viewport' },
        },
        {
          path: 'about',
          name: 'about',
          component: AboutView,
          meta: { appMainLayout: 'full-viewport' },
        },
        {
          path: 'recommend',
          name: 'recommend',
          component: RecommendView,
          meta: { appMainLayout: 'full-viewport' },
        },
        { path: ':pathMatch(.*)*', name: 'not-found', component: NotFoundView },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  applyPagePhotoBackgroundToDocument(to)
  syncPageCorruptForRoute(to.name)
})

export default router
