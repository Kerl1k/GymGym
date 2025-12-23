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
    <header className="bg-background border-b border-border/40 shadow-sm py-3 px-4 mb-6 sticky top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap">
        <Link to={ROUTES.HOME}>
          <div className="text-xl font-semibold">Gym note</div>
        </Link>
        <nav className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" className="justify-start" asChild>
            <Link to={ROUTES.HOME}>Упражнения</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to={ROUTES.ACTIVE_TRAINING}>Начать тренировку</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to={ROUTES.TRAINING}>Тренировки</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to={ROUTES.TEST}>TEST</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-4">
          <Link to={ROUTES.PROFILE}>
            <span className="text-sm text-muted-foreground">
              {session.email}
            </span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="hover:bg-destructive/10"
          >
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
