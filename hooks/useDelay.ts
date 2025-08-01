import { useState } from "react";
export const useDelay = () => {
  const [delay, setDelay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkDelay = async () => {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const res = await fetch("https://worldtimeapi.org/api/timezone/UTC");
      if (res.status !== 200) {
        setError("request fail");
        setLoading(false);
        return;
      }

      const body = await res.json();

      const utc_datetime = body.utc_datetime;
      if (typeof utc_datetime !== "string") {
        setError("invalid response");
        setLoading(false);
        return;
      }
      const serverDate = new Date(utc_datetime);

      setDelay(serverDate.getTime() - now.getTime());
    } catch (e: any) {
      console.log(e);
      if (e.message) {
        console.log(e.message);
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return [delay, loading, error, checkDelay] as const;
};
