import { configureStore } from '@reduxjs/toolkit';

import { trackedReducer } from '../features/tracked';
import { githubApi } from '../services/github';
import { listenerMiddleware } from './listeners';

export const store = configureStore({
  reducer: {
    tracked: trackedReducer,
    [githubApi.reducerPath]: githubApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(githubApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
