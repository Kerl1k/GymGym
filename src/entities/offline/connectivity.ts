import { makeAutoObservable, runInAction } from "mobx";

class ConnectivityStore {
  isOnline =
    typeof navigator === "undefined" ? true : navigator.onLine;

  private started = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;

    const setOnline = () => {
      runInAction(() => {
        this.isOnline = true;
      });
    };
    const setOffline = () => {
      runInAction(() => {
        this.isOnline = false;
      });
    };

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);
    runInAction(() => {
      this.isOnline = navigator.onLine;
    });
  }
}

export const connectivityStore = new ConnectivityStore();
