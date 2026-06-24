import { makeAutoObservable, runInAction } from "mobx";

import { toApiErrorCode } from "@/entities/api/request";
import { fetchClient, publicFetchClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

class AuthStore {
  profile: ApiSchemas["Profile"] | null | undefined = undefined;
  isProfileFetching = false;
  loginPending = false;
  registerPending = false;
  loginErrorCode?: string;
  registerErrorCode?: string;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async fetchProfile(force = false): Promise<void> {
    if (this.isProfileFetching) return;
    if (!force && this.profile !== undefined) return;

    runInAction(() => {
      this.isProfileFetching = true;
    });

    try {
      const result = await fetchClient.GET("/api/auth/profile");
      if (result.error) {
        throw result.error;
      }

      runInAction(() => {
        this.profile = result.data ?? null;
      });
    } finally {
      runInAction(() => {
        this.isProfileFetching = false;
      });
    }
  }

  async login(data: ApiSchemas["AuthLoginBody"]) {
    runInAction(() => {
      this.loginPending = true;
      this.loginErrorCode = undefined;
    });

    try {
      const result = await publicFetchClient.POST("/api/auth/login", { body: data });
      if (result.error) {
        runInAction(() => {
          this.loginErrorCode = toApiErrorCode(result.error);
        });
        return null;
      }

      return result.data ?? null;
    } finally {
      runInAction(() => {
        this.loginPending = false;
      });
    }
  }

  async register(data: ApiSchemas["AuthRegisterBody"]) {
    runInAction(() => {
      this.registerPending = true;
      this.registerErrorCode = undefined;
    });

    try {
      const result = await publicFetchClient.POST("/api/auth/register", { body: data });
      if (result.error) {
        runInAction(() => {
          this.registerErrorCode = toApiErrorCode(result.error);
        });
        return null;
      }

      return result.data ?? null;
    } finally {
      runInAction(() => {
        this.registerPending = false;
      });
    }
  }
}

export const authStore = new AuthStore();
