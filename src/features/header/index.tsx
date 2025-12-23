import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Button } from "@/shared/ui/kit/button";
import { Link } from "react-router-dom";

export function AppHeader() {
  const { session, logout } = useSession();

  if (!session) {
    return null;
  }

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border/20 shadow-sm py-4 px-4 sm:px-6 mb-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <Link to={ROUTES.HOME}>
          <div className="text-2xl font-bold text-gradient animate-fade-in">
            GymGym
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button
            variant="ghost"
            className="justify-start text-sm sm:text-base hover-lift"
            asChild
          >
            <Link to={ROUTES.HOME}>Упражнения</Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-sm sm:text-base hover-lift"
            asChild
          >
            <Link to={ROUTES.ACTIVE_TRAINING}>Тренировки</Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-sm sm:text-base hover-lift"
            asChild
          >
            <Link to={ROUTES.TRAINING}>Мои тренировки</Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-sm sm:text-base hover-lift"
            asChild
          >
            <Link to={ROUTES.TEST}>Статистика</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to={ROUTES.PROFILE}>
            <span className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">
              {session.email}
            </span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 transition-all"
          >
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
