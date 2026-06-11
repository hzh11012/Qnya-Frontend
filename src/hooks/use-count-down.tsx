import { useCallback, useEffect, useRef, useState } from 'react';

const useCountDown = (initCount: number = 60) => {
  const timeId = useRef(0);
  const [count, setCount] = useState(initCount);
  const [isDisable, setIsDisable] = useState(false);

  const start = useCallback(() => {
    window.clearInterval(timeId.current);
    setCount(initCount);
    setIsDisable(true);
    timeId.current = window.setInterval(() => {
      setCount(c => c - 1);
    }, 1000);
  }, [initCount]);

  useEffect(() => {
    return () => window.clearInterval(timeId.current);
  }, []);

  useEffect(() => {
    if (count === 0) {
      window.clearInterval(timeId.current);
    }
  }, [count]);

  useEffect(() => {
    if (count === 0) {
      const id = setTimeout(() => {
        setCount(initCount);
        setIsDisable(false);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [count, initCount]);

  const reset = useCallback(() => {
    window.clearInterval(timeId.current);
    setCount(initCount);
    setIsDisable(false);
  }, [initCount]);

  return { start, count, isDisable, reset };
};

export default useCountDown;
