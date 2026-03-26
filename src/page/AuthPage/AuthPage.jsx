import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../asset/logo.png";
import "./AuthPage.css";
import useAuth from "../../hooks/useAuth";
import { useOtp } from "../../hooks/useOtp";
import { useUser } from "../../hooks/useUser";
import { register, resetPassword } from "../../api/service/authService";
import { handleApiError } from "../../utils/handleApiError";
import { initialFormState } from "./constants";
import RegisterForm from "../../component/AuthForm/RegisterForm";
import ForgotPasswordForm from "../../component/AuthForm/RegisterForm";
import LoginForm from "../../component/AuthForm/LoginForm";


function AuthPage() {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState(initialFormState);
  const [fieldError, setFieldError] = useState({});
  const [registerStep, setRegisterStep] = useState(1);
  const [forgotStep, setForgotStep] = useState(1);
  const [registerVerifyToken, setRegisterVerifyToken] = useState("");
  const [forgotVerifyToken, setForgotVerifyToken] = useState("");

  const navigate = useNavigate();
  const { countdown, send, verify, setCountdown } = useOtp();

  const { handleLogin, loading, status, setStatus } = useAuth({
    navigate

  });


  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setCountdown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [countdown, setCountdown]);

  const clearErrors = () => {
    setFieldError({});
    setStatus({});
  };

  const resetAuthState = () => {
    setFormData(initialFormState);
    setRegisterStep(1);
    setForgotStep(1);
    setRegisterVerifyToken("");
    setForgotVerifyToken("");
    setCountdown(0);
    clearErrors();
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetAuthState();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const finalValue = type === "checkbox" ? checked : value;

    if (fieldError[name]) {
      setFieldError((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }

    if (status?.message) {
      setStatus({});
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleLoginSubmit = async () => {
    setFieldError({});
    await handleLogin(formData, setFieldError);
  };

  const handleSendRegisterOtp = async () => {
    try {
      clearErrors();
      await send(formData.phone, "REGISTER");
      setFormData((previous) => ({ ...previous, otp: "" }));
      setRegisterStep(2);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    }
  };

  const handleVerifyRegisterOtp = async () => {
    try {
      clearErrors();
      const verifyToken = await verify(
        formData.phone,
        formData.otp,
        "REGISTER",
      );
      setRegisterVerifyToken(verifyToken || "");
      setRegisterStep(3);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    }
  };

  const handleRegister = async () => {
    try {
      clearErrors();
      await register({
        firstname: formData.firstname,
        lastname: formData.lastname,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        birthday: formData.birthday,
        gender: Number(formData.gender),
        verifyToken: registerVerifyToken,
      });

      setStatus({
        type: "success",
        message: "Đăng ký thành công. Vui lòng đăng nhập.",
      });
      setMode("login");
      setFormData((previous) => ({
        ...initialFormState,
        phone: previous.phone,
      }));
      setRegisterStep(1);
      setRegisterVerifyToken("");
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    }
  };

  const handleSendForgotOtp = async () => {
    try {
      clearErrors();
      await send(formData.phone, "RESET_PASSWORD");
      setFormData((previous) => ({ ...previous, otp: "" }));
      setForgotStep(2);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    }
  };

  const handleVerifyForgotOtp = async () => {
    try {
      clearErrors();
      const verifyToken = await verify(
        formData.phone,
        formData.otp,
        "RESET_PASSWORD",
      );
      setForgotVerifyToken(verifyToken || "");
      setForgotStep(3);
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    }
  };

  const handleResetPassword = async () => {
    try {
      clearErrors();
      await resetPassword({
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        verifyToken: forgotVerifyToken,
      });

      setStatus({
        type: "success",
        message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.",
      });
      setMode("login");
      setFormData((previous) => ({
        ...initialFormState,
        phone: previous.phone,
      }));
      setForgotStep(1);
      setForgotVerifyToken("");
    } catch (error) {
      handleApiError(error, setStatus, setFieldError);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <section className="auth__hero">
          <h1>Kết nối với mọi người</h1>
          <img src={logo} alt="" />
        </section>
        <section className="auth__form">
          <div className="auth__tab">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Đăng nhập
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Đăng ký
            </button>
          </div>

          {status?.message ? (
            <div
              className={`auth__status ${status.type === "error" ? "auth__status--error" : "auth__status--success"}`}
            >
              {status.message}
            </div>
          ) : null}

          {mode === "login" && (
            <LoginForm
              formData={formData}
              fieldError={fieldError}
              loading={loading}
              showCaptcha={false}
              onChange={handleChange}
              onForgotPassword={() => {
                clearErrors();
                setMode("forgot");
                setForgotStep(1);
              }}
              onSubmit={handleLoginSubmit}
            />
          )}

          {mode === "register" && (
            <RegisterForm
              registerStep={registerStep}
              formData={formData}
              fieldError={fieldError}
              loading={loading}
              countdown={countdown}
              onChange={handleChange}
              onBack={() => {
                clearErrors();
                if (registerStep === 2) {
                  setRegisterStep(1);
                } else if (registerStep === 3) {
                  setRegisterStep(2);
                }
              }}
              onOtpChange={(value) => {
                if (fieldError.otp) {
                  setFieldError((previous) => {
                    const next = { ...previous };
                    delete next.otp;
                    return next;
                  });
                }
                setFormData((previous) => ({ ...previous, otp: value }));
              }}
              onSendOtp={handleSendRegisterOtp}
              onVerifyOtp={handleVerifyRegisterOtp}
              onResendOtp={handleSendRegisterOtp}
              onRegister={handleRegister}
            />
          )}

          {mode === "forgot" && (
            <ForgotPasswordForm
              forgotStep={forgotStep}
              formData={formData}
              fieldError={fieldError}
              loading={loading}
              countdown={countdown}
              onChange={handleChange}
              onBackToLogin={() => switchMode("login")}
              onBackStep={() => {
                clearErrors();
                if (forgotStep === 2) {
                  setForgotStep(1);
                } else if (forgotStep === 3) {
                  setForgotStep(2);
                }
              }}
              onOtpChange={(value) => {
                if (fieldError.otp) {
                  setFieldError((previous) => {
                    const next = { ...previous };
                    delete next.otp;
                    return next;
                  });
                }
                setFormData((previous) => ({ ...previous, otp: value }));
              }}
              onSendOtp={handleSendForgotOtp}
              onVerifyOtp={handleVerifyForgotOtp}
              onResendOtp={handleSendForgotOtp}
              onResetPassword={handleResetPassword}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
