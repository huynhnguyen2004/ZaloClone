import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../asset/logo.png";
import "./AuthPage.css";
import { initialFormState, SITE_KEY } from "./constants";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import useAuthActions from "./hooks/useAuthActions";
import { useUser } from "../../hooks/UseUser";
function AuthPage() {
  const [mode, setMode] = useState("login");
  const [registerStep, setRegisterStep] = useState(1);
  const [forgotStep, setForgotStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldError, setFieldError] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const captchaRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    navigate(user.role === "Customer" ? "/home" : "/admin");
    setIsBootstrapping(false);
  }, [user, navigate]);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(
      () => setCountdown((previous) => previous - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!status?.message) return;
    const timer = setTimeout(() => setStatus({ type: "", message: "" }), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const actions = useAuthActions({
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
    navigate,
    captchaRef,
    initialFormState,
  });

  const resetFormContext = () => {
    setFormData(initialFormState);
    setFieldError({});
    setStatus({ type: "", message: "" });
    setCountdown(0);
    setCaptchaToken(null);
  };

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode);
    setRegisterStep(1);
    setForgotStep(1);
    resetFormContext();
  };

  const handleRegisterBack = () => {
    if (registerStep <= 1) return;
    setRegisterStep((previous) => previous - 1);
    setStatus({ type: "", message: "" });
  };

  const handleForgotBackStep = () => {
    if (forgotStep <= 1) return;
    setForgotStep((previous) => previous - 1);
    setStatus({ type: "", message: "" });
  };

  const handleRegister = async () => {
    const success = await actions.handleRegister();
    if (!success) return;

    setTimeout(() => {
      setMode("login");
      setRegisterStep(1);
      resetFormContext();
    }, 1500);
  };

  const handleResetPassword = async () => {
    const success = await actions.handleResetPassword();
    if (!success) return;

    setTimeout(() => {
      setMode("login");
      setForgotStep(1);
      resetFormContext();
    }, 1500);
  };

  if (isBootstrapping) {
    return null;
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <section className="auth__hero">
          <div className="auth__badge">
            <span className="auth__badge-icon">💬</span>
          </div>
          <h1>Kết nối với mọi người</h1>
          <p>
            Nơi bạn có thể trò chuyện, chia sẻ khoảnh khắc và giữ liên lạc với
            những người quan trọng.
          </p>
          <img src={logo} alt="Connect illustration" />
        </section>

        <section className="auth__form">
          <div className="auth__tab">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => handleModeSwitch("login")}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => handleModeSwitch("register")}
              type="button"
            >
              Đăng ký
            </button>
          </div>

          {status?.message && (
            <div className={`auth__alert ${status.type}`}>{status.message}</div>
          )}

          {mode === "login" ? (
            <LoginForm
              formData={formData}
              fieldError={fieldError}
              loading={loading}
              rememberMe={rememberMe}
              showCaptcha={showCaptcha}
              captchaRef={captchaRef}
              siteKey={SITE_KEY}
              onChange={actions.handleChange}
              onRememberChange={setRememberMe}
              onCaptchaChange={setCaptchaToken}
              onSubmit={actions.handleLogin}
              onForgotPassword={() => handleModeSwitch("forgot")}
            />
          ) : mode === "forgot" ? (
            <ForgotPasswordForm
              forgotStep={forgotStep}
              formData={formData}
              fieldError={fieldError}
              loading={loading}
              countdown={countdown}
              onChange={actions.handleChange}
              onBackToLogin={() => handleModeSwitch("login")}
              onBackStep={handleForgotBackStep}
              onOtpChange={actions.updateOtpValue}
              onSendOtp={actions.handleSendForgotOtp}
              onVerifyOtp={actions.handleVerifyForgotOtp}
              onResendOtp={actions.handleResendForgotOtp}
              onResetPassword={handleResetPassword}
            />
          ) : (
            <RegisterForm
              registerStep={registerStep}
              formData={formData}
              fieldError={fieldError}
              loading={loading}
              countdown={countdown}
              onChange={actions.handleChange}
              onBack={handleRegisterBack}
              onOtpChange={actions.updateOtpValue}
              onSendOtp={actions.handleSendRegisterOtp}
              onVerifyOtp={actions.handleVerifyRegisterOtp}
              onResendOtp={actions.handleResendRegisterOtp}
              onRegister={handleRegister}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
