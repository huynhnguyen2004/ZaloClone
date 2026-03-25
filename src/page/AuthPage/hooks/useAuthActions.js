import { useCallback } from "react";
import { login, register, sendOtp, verifyOtp, resetPassword } from "../../../api/service/authService";
import { handleApiError } from "../../../utils/handleApiError";

export default function useAuthActions({
  formData,
  countdown,
  rememberMe,
  captchaToken,
  showCaptcha,
  setFormData,
  setFieldError,
  setStatus,
  setLoading,
  setRegisterStep,
  setForgotStep,
  setCountdown,
  setShowCaptcha,
  setCaptchaToken,
  fetchCurrentUser,
  navigate,
  captchaRef,
  initialFormState,
}) {
  const handleChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      setFormData((previous) => ({ ...previous, [name]: value }));
      setFieldError((previous) => ({ ...previous, [name]: "" }));
    },
    [setFormData, setFieldError]
  );

  const updateOtpValue = useCallback(
    (nextOtp) => {
      setFormData((previous) => ({ ...previous, otp: nextOtp }));
      setFieldError((previous) => ({ ...previous, otp: "" }));
    },
    [setFieldError, setFormData]
  );

  const handleSendRegisterOtp = useCallback(async () => {
    if (!formData.phone) {
      setFieldError((previous) => ({ ...previous, phone: "Vui lòng nhập số điện thoại" }));
      setStatus({ type: "error", message: "Vui lòng nhập số điện thoại" });
      return;
    }

    try {
      setLoading(true);
      await sendOtp({ phone: formData.phone, otpPurpose: "REGISTER" });
      setStatus({ type: "success", message: "Mã OTP đã được gửi đến số điện thoại của bạn" });
      setRegisterStep(2);
      setCountdown(60);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    } finally {
      setLoading(false);
    }
  }, [formData.phone, setCountdown, setFieldError, setLoading, setRegisterStep, setStatus]);

  const handleVerifyRegisterOtp = useCallback(async () => {
    if (formData.otp.length !== 6) {
      setFieldError((previous) => ({ ...previous, otp: "Vui lòng nhập đủ 6 số OTP" }));
      setStatus({ type: "error", message: "Vui lòng nhập đủ 6 số OTP" });
      return;
    }

    try {
      setLoading(true);
      const { data } = await verifyOtp({
        phone: formData.phone,
        otp: formData.otp,
        otpPurpose: "REGISTER",
      });

      const verifyToken = data?.result?.verifyToken || data?.verifyToken;
      if (!verifyToken) {
        setStatus({ type: "error", message: "Không nhận được token xác thực" });
        return;
      }

      sessionStorage.setItem("verifyRegisterTokenOtp", verifyToken);
      setStatus({ type: "success", message: "Xác thực OTP thành công" });
      setRegisterStep(3);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    } finally {
      setLoading(false);
    }
  }, [formData.otp, formData.phone, setFieldError, setLoading, setRegisterStep, setStatus]);

  const handleResendRegisterOtp = useCallback(async () => {
    if (countdown > 0) return;

    try {
      setLoading(true);
      await sendOtp({ phone: formData.phone, otpPurpose: "REGISTER" });
      setStatus({ type: "success", message: "Mã OTP mới đã được gửi" });
      setCountdown(60);
      setFormData((previous) => ({ ...previous, otp: "" }));
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    } finally {
      setLoading(false);
    }
  }, [countdown, formData.phone, setCountdown, setFieldError, setFormData, setLoading, setStatus]);

  const handleRegister = useCallback(async () => {
    if (formData.password !== formData.confirmPassword) {
      setFieldError((previous) => ({ ...previous, confirmPassword: "Mật khẩu xác nhận không khớp" }));
      setStatus({ type: "error", message: "Mật khẩu xác nhận không khớp" });
      return false;
    }

    const verifyToken = sessionStorage.getItem("verifyRegisterTokenOtp");
    if (!verifyToken) {
      setStatus({ type: "error", message: "Phiên xác thực đã hết hạn, vui lòng thử lại" });
      setRegisterStep(1);
      return false;
    }

    try {
      setLoading(true);
      await register({
        verifyTokenOtp: verifyToken,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        birthday: formData.birthday,
        gender: parseInt(formData.gender, 10),
      });

      sessionStorage.removeItem("verifyRegisterTokenOtp");
      setStatus({ type: "success", message: "Tạo tài khoản thành công! Đang chuyển đến đăng nhập..." });
      return true;
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, setFieldError, setLoading, setRegisterStep, setStatus]);

  const handleLogin = useCallback(async () => {
    setStatus({ type: "", message: "" });

    if (showCaptcha && !captchaToken) {
      setStatus({ type: "error", message: "Vui lòng xác minh captcha" });
      return;
    }

    try {
      setLoading(true);
      const { data } = await login({
        phone: formData.phone,
        password: formData.password,
        isRememberMe: rememberMe,
        captchaToken: showCaptcha ? captchaToken : null,
      });

      const token = data?.result?.accessToken;
      if (token) {
        setCaptchaToken(null);
        sessionStorage.setItem("token", token);

        try {
          const user = await fetchCurrentUser();
          if (user) {
            navigate(user.role === "Customer" ? "/home" : "/admin");
          }
        } catch (error) {
          console.warn("Không thể fetch user sau login:", error);
        }
      }

      setFormData(initialFormState);
      setFieldError({});
    } catch (error) {
      if (error?.response?.data?.code === "CAPTCHA_REQUIRED") {
        setShowCaptcha(true);
      }

      handleApiError(error, setStatus, setFieldError);

      if (captchaRef.current) {
        captchaRef.current.reset();
      }
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  }, [
    captchaRef,
    captchaToken,
    fetchCurrentUser,
    formData,
    initialFormState,
    navigate,
    rememberMe,
    setCaptchaToken,
    setFieldError,
    setFormData,
    setLoading,
    setShowCaptcha,
    setStatus,
    showCaptcha,
  ]);

  const handleSendForgotOtp = useCallback(async () => {
    if (!formData.phone) {
      setFieldError((previous) => ({ ...previous, phone: "Vui lòng nhập số điện thoại" }));
      setStatus({ type: "error", message: "Vui lòng nhập số điện thoại" });
      return;
    }

    try {
      setLoading(true);
      await sendOtp({ phone: formData.phone, otpPurpose: "RESET_PASSWORD" });
      setStatus({ type: "success", message: "Mã OTP đã được gửi đến số điện thoại của bạn" });
      setForgotStep(2);
      setCountdown(60);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    } finally {
      setLoading(false);
    }
  }, [formData.phone, setCountdown, setFieldError, setForgotStep, setLoading, setStatus]);

  const handleVerifyForgotOtp = useCallback(async () => {
    if (formData.otp.length !== 6) {
      setFieldError((previous) => ({ ...previous, otp: "Vui lòng nhập đủ 6 số OTP" }));
      setStatus({ type: "error", message: "Vui lòng nhập đủ 6 số OTP" });
      return;
    }

    try {
      setLoading(true);
      const { data } = await verifyOtp({
        phone: formData.phone,
        otp: formData.otp,
        otpPurpose: "RESET_PASSWORD",
      });

      const verifyToken = data?.result?.verifyToken || data?.verifyToken;
      if (!verifyToken) {
        setStatus({ type: "error", message: "Không nhận được token xác thực" });
        return;
      }

      sessionStorage.setItem("verifyForgotTokenOtp", verifyToken);
      setStatus({ type: "success", message: "Xác thực OTP thành công" });
      setForgotStep(3);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    } finally {
      setLoading(false);
    }
  }, [formData.otp, formData.phone, setFieldError, setForgotStep, setLoading, setStatus]);

  const handleResendForgotOtp = useCallback(async () => {
    if (countdown > 0) return;

    try {
      setLoading(true);
      await sendOtp({ phone: formData.phone, otpPurpose: "RESET_PASSWORD" });
      setStatus({ type: "success", message: "Mã OTP mới đã được gửi" });
      setCountdown(60);
      setFormData((previous) => ({ ...previous, otp: "" }));
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    } finally {
      setLoading(false);
    }
  }, [countdown, formData.phone, setCountdown, setFieldError, setFormData, setLoading, setStatus]);

  const handleResetPassword = useCallback(async () => {
    if (formData.password !== formData.confirmPassword) {
      setFieldError((previous) => ({ ...previous, confirmPassword: "Mật khẩu xác nhận không khớp" }));
      setStatus({ type: "error", message: "Mật khẩu xác nhận không khớp" });
      return false;
    }

    const verifyToken = sessionStorage.getItem("verifyForgotTokenOtp");
    if (!verifyToken) {
      setStatus({ type: "error", message: "Phiên xác thực đã hết hạn, vui lòng thử lại" });
      setForgotStep(1);
      return false;
    }

    try {
      setLoading(true);
      await resetPassword({
        verifyTokenOtp: verifyToken,
        password: formData.password,
      });

      sessionStorage.removeItem("verifyForgotTokenOtp");
      setStatus({ type: "success", message: "Đặt lại mật khẩu thành công! Đang chuyển đến đăng nhập..." });
      return true;
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, setFieldError, setForgotStep, setLoading, setStatus]);

  return {
    handleChange,
    updateOtpValue,
    handleSendRegisterOtp,
    handleVerifyRegisterOtp,
    handleResendRegisterOtp,
    handleRegister,
    handleLogin,
    handleSendForgotOtp,
    handleVerifyForgotOtp,
    handleResendForgotOtp,
    handleResetPassword,
  };
}
