export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
export const log = (...args: any[]) =>
  console.log(new Date().toISOString(), ...args);

export const fetchWithTimeout = async (
  url: string,
  timeout: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (e) {
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number,
  initialDelay: number,
): Promise<T> => {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (attempt > maxRetries) throw e;

      log(`retryWithExponentialBackoff fail (attempt ${attempt})`, e);
      attempt++;
      await sleep(initialDelay * Math.pow(2, attempt - 1));
    }
  }
};
