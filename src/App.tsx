import { LessonPage } from './lesson/LessonPage'
import { useRoute } from './lib/router'
import { Home } from './pages/Home'
import { Playground } from './pages/Playground'
import { Review } from './pages/Review'
import { Trailer } from './pages/Trailer'
import { AchievementToasts, AchievementsPage } from './ui/achievements'
import { Credits, RotateHint } from './ui/chrome'
import { useEffect } from 'react'
import { useProgress } from './store/progress'

export function App() {
  const route = useRoute()
  useEffect(() => {
    // Logro secreto para quien estudia de noche.
    const h = new Date().getHours()
    if (h >= 23 || h < 5) useProgress.getState().bump('night')
    useProgress.getState().checkAchievements()
  }, [])
  if (route.page === 'trailer') return <Trailer />
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        {route.page === 'home' && <Home />}
        {route.page === 'playground' && <Playground />}
        {route.page === 'review' && <Review />}
        {route.page === 'achievements' && <AchievementsPage />}
        {route.page === 'lesson' && <LessonPage key={`${route.id}/${route.from}`} id={route.id} from={route.from} />}
      </div>
      <Credits />
      <AchievementToasts />
      <RotateHint />
    </div>
  )
}
