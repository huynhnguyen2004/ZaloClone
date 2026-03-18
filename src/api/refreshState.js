let isRefreshing = false;
let failedQueue = [];

export const isRefreshInProgress = () => isRefreshing;

export const setRefreshInProgress = (value) => {
  isRefreshing = value;
};

export const enqueueFailedRequest = (resolve, reject) => {
  failedQueue.push({ resolve, reject });
};

export const processRefreshQueue = (error, token = null) => {
  failedQueue.forEach((promiseHandlers) => {
    if (error) {
      promiseHandlers.reject(error);
      return;
    }

    promiseHandlers.resolve(token);
  });

  failedQueue = [];
};
