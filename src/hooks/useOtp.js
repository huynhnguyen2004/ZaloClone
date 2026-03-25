import { useState } from "react";
import { sendOtp, verifyOtp } from "../api/service/authService";

export function useOtp() {
  const [countdown, setCountdown] = useState(0);

  const send = async (phone, type) => {
    await sendOtp({ phone, otpPurpose: type });
    setCountdown(60);
  };

  const verify = async (phone, otp, type) => {
    const { data } = await verifyOtp({ phone, otp, otpPurpose: type });
    return data?.result?.verifyToken;
  };

  return { countdown, send, verify, setCountdown };
}