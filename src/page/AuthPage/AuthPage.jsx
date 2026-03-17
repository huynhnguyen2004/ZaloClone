import { useEffect, useRef, useState } from "react";
import { login, register, sendOtp, verifyOtp, resetPassword } from "../../api/service/authService";
import "./AuthPage.css";
import logo from "../../asset/logo.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ReCAPTCHA from "react-google-recaptcha";

const initialFormState = {
  firstname: "",
  lastname: "",
  phone: "",
  password: "",
  confirmPassword: "",
  birthday: "",
  gender: 0,
  otp: "",
};

const SITE_KEY = "6LchvTUsAAAAAHygJx9houBHwGhQvHAtOf_yWUa3";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [registerStep, setRegisterStep] = useState(1); // 1: phone, 2: otp, 3: info
  const [formData, setFormData] = useState(initialFormState);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [forgotStep, setForgotStep] = useState(1);
  const captchaRef = useRef(null);
  const otpInputsRef = useRef([]);

  const navigate = useNavigate();
  const { fetchCurrentUser } = useUser();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (!status?.message) return;
    const timer = setTimeout(() => {
      setStatus({ type: "", message: "" });
    }, 3000);
    return () => clearTimeout(timer);
  }, [status]);

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = formData.otp.split("");
    newOtp[index] = value;
    const otpString = newOtp.join("").slice(0, 6);
    
    setFormData((prev) => ({ ...prev, otp: otpString }));

    // Auto focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, otp: pastedData }));
    const focusIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[focusIndex]?.focus();
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!formData.phone) {
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
      const apiMessage = error.response?.data?.message ;
     
      
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (formData.otp.length !== 6) {
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
      if (verifyToken) {
        sessionStorage.setItem("verifyRegisterTokenOtp", verifyToken);
        setStatus({ type: "success", message: "Xác thực OTP thành công" });
        setRegisterStep(3);
      } else {
        setStatus({ type: "error", message: "Không nhận được token xác thực" });
      }
    } catch (error) {
      const apiMessage = error.response?.data?.message || "Xác thực OTP thất bại";
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    try {
      setLoading(true);
      await sendOtp({ phone: formData.phone, otpPurpose: "REGISTER" });
      setStatus({ type: "success", message: "Mã OTP mới đã được gửi" });
      setCountdown(60);
      setFormData((prev) => ({ ...prev, otp: "" }));
    } catch (error) {
      const apiMessage = error.response?.data?.message ;
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Complete registration
  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: "error", message: "Mật khẩu xác nhận không khớp" });
      return;
    }

    const verifyToken = sessionStorage.getItem("verifyRegisterTokenOtp");
    if (!verifyToken) {
      setStatus({ type: "error", message: "Phiên xác thực đã hết hạn, vui lòng thử lại" });
      setRegisterStep(1);
      return;
    }

    try {
      setLoading(true);
      await register({
        verifyTokenOtp: verifyToken,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        birthday: formData.birthday,
        gender: parseInt(formData.gender),
      });
      
      sessionStorage.removeItem("verifyRegisterTokenOtp");
      setStatus({ type: "success", message: "Tạo tài khoản thành công! Đang chuyển đến đăng nhập..." });
      
      setTimeout(() => {
        setMode("login");
        setRegisterStep(1);
        setFormData(initialFormState);
      }, 1500);
    } catch (error) {
      const apiMessage = error.response?.data?.message || "Đăng ký thất bại";
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (event) => {
    event.preventDefault();
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
        captchaToken: showCaptcha ? captchaToken : null,
      });

      const token = data?.result?.accessToken;
      if (token) {
        setCaptchaToken(null);
        sessionStorage.setItem("token", token);
        
        try {
          const user = await fetchCurrentUser();
          if (user) {
            if (user.role === "Customer") {
              navigate("/home");
            } else {
              navigate("/admin");
            }
          }
        } catch (error) {
          console.warn("Không thể fetch user sau login:", error);
        }
      }
      setFormData(initialFormState);
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      
      if (apiMessage === "CAPTCHA_REQUIRED") {
        setShowCaptcha(true);
      } else {
        setStatus({ type: "error", message: apiMessage });
      }

      if (captchaRef.current) {
        captchaRef.current.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - Send OTP
  const handleForgotSendOtp = async () => {
    if (!formData.phone) {
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
      const apiMessage = error.response?.data?.message || "Gửi OTP thất bại";
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - Verify OTP
  const handleForgotVerifyOtp = async () => {
    if (formData.otp.length !== 6) {
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
      if (verifyToken) {
        sessionStorage.setItem("verifyForgotTokenOtp", verifyToken);
        setStatus({ type: "success", message: "Xác thực OTP thành công" });
        setForgotStep(3);
      } else {
        setStatus({ type: "error", message: "Không nhận được token xác thực" });
      }
    } catch (error) {
      const apiMessage = error.response?.data?.message || "Xác thực OTP thất bại";
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - Resend OTP
  const handleForgotResendOtp = async () => {
    if (countdown > 0) return;
    try {
      setLoading(true);
      await sendOtp({ phone: formData.phone, otpPurpose: "RESET_PASSWORD" });
      setStatus({ type: "success", message: "Mã OTP mới đã được gửi" });
      setCountdown(60);
      setFormData((prev) => ({ ...prev, otp: "" }));
    } catch (error) {
      const apiMessage = error.response?.data?.message || "Gửi lại OTP thất bại";
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - Reset password
  const handleResetPassword = async () => {
    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: "error", message: "Mật khẩu xác nhận không khớp" });
      return;
    }
    const verifyToken = sessionStorage.getItem("verifyForgotTokenOtp");
    if (!verifyToken) {
      setStatus({ type: "error", message: "Phiên xác thực đã hết hạn, vui lòng thử lại" });
      setForgotStep(1);
      return;
    }
    try {
      setLoading(true);
      await resetPassword({
        verifyTokenOtp: verifyToken,
        password: formData.password,
      });
      sessionStorage.removeItem("verifyForgotTokenOtp");
      setStatus({ type: "success", message: "Đặt lại mật khẩu thành công! Đang chuyển đến đăng nhập..." });
      setTimeout(() => {
        setMode("login");
        setForgotStep(1);
        setFormData(initialFormState);
      }, 1500);
    } catch (error) {
      const apiMessage = error.response?.data?.message || "Đặt lại mật khẩu thất bại";
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  // Switch mode handler
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setRegisterStep(1);
    setForgotStep(1);
    setFormData(initialFormState);
    setStatus({ type: "", message: "" });
  };

  // Go back to previous step
  const handleBack = () => {
    if (registerStep > 1) {
      setRegisterStep(registerStep - 1);
      setStatus({ type: "", message: "" });
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="auth__steps">
      <div className={`auth__step ${registerStep >= 1 ? "active" : ""} ${registerStep > 1 ? "completed" : ""}`}>
        <div className="auth__step-number">{registerStep > 1 ? "✓" : "1"}</div>
        <span>Số điện thoại</span>
      </div>
      <div className={`auth__step-line ${registerStep > 1 ? "active" : ""}`}></div>
      <div className={`auth__step ${registerStep >= 2 ? "active" : ""} ${registerStep > 2 ? "completed" : ""}`}>
        <div className="auth__step-number">{registerStep > 2 ? "✓" : "2"}</div>
        <span>Xác thực OTP</span>
      </div>
      <div className={`auth__step-line ${registerStep > 2 ? "active" : ""}`}></div>
      <div className={`auth__step ${registerStep >= 3 ? "active" : ""}`}>
        <div className="auth__step-number">3</div>
        <span>Thông tin</span>
      </div>
    </div>
  );

  // Render step 1: Phone input
  const renderPhoneStep = () => (
    <div className="auth__step-content fade-in">
      <div className="auth__welcome">
        <h2>Nhập số điện thoại</h2>
        <p>Chúng tôi sẽ gửi mã OTP để xác thực số điện thoại của bạn</p>
      </div>

      <label>
        Số điện thoại
        <input
          name="phone"
          type="tel"
          placeholder="0912345678"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </label>

      <button
        type="button"
        className="auth__submit"
        onClick={handleSendOtp}
        disabled={loading || !formData.phone}
      >
        {loading ? "Đang gửi..." : "Gửi mã OTP"}
      </button>
    </div>
  );

  // Render step 2: OTP verification
  const renderOtpStep = () => (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={handleBack}>
        ← Quay lại
      </button>

      <div className="auth__welcome">
        <h2>Xác thực OTP</h2>
        <p>Nhập mã 6 số đã gửi đến <strong>{formData.phone}</strong></p>
      </div>

      <div className="auth__otp-inputs" onPaste={handleOtpPaste}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (otpInputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="auth__otp-input"
            value={formData.otp[index] || ""}
            onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
          />
        ))}
      </div>

      <div className="auth__otp-actions">
        <button
          type="button"
          className="auth__resend-btn"
          onClick={handleResendOtp}
          disabled={countdown > 0 || loading}
        >
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}
        </button>
      </div>

      <button
        type="button"
        className="auth__submit"
        onClick={handleVerifyOtp}
        disabled={loading || formData.otp.length !== 6}
      >
        {loading ? "Đang xác thực..." : "Xác nhận"}
      </button>
    </div>
  );

  // Render step 3: Registration form
  const renderInfoStep = () => (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={handleBack}>
        ← Quay lại
      </button>

      <div className="auth__welcome">
        <h2>Hoàn tất đăng ký</h2>
        <p>Điền thông tin cá nhân để tạo tài khoản</p>
      </div>

      <div className="auth__name-fields">
        <label>
          Tên
          <input
            name="firstname"
            placeholder="Nguyễn"
            value={formData.firstname}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Họ
          <input
            name="lastname"
            placeholder="Văn A"
            value={formData.lastname}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <label>
        Mật khẩu
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Xác nhận mật khẩu
        <input
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Ngày sinh
        <input
          type="date"
          name="birthday"
          value={formData.birthday}
          onChange={handleChange}
          required
        />
      </label>

      <div className="auth__gender">
        <span>Giới tính</span>
        <div className="auth__gender-options">
          <label>
            <input
              type="radio"
              name="gender"
              value={0}
              checked={parseInt(formData.gender) === 0}
              onChange={handleChange}
            />
            Nam
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value={1}
              checked={parseInt(formData.gender) === 1}
              onChange={handleChange}
            />
            Nữ
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value={2}
              checked={parseInt(formData.gender) === 2}
              onChange={handleChange}
            />
            Khác
          </label>
        </div>
      </div>

      <button
        type="button"
        className="auth__submit"
        onClick={handleRegister}
        disabled={loading || !formData.firstname || !formData.lastname || !formData.password || !formData.confirmPassword || !formData.birthday}
      >
        {loading ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
      </button>
    </div>
  );

  // Render forgot password step indicator
  const renderForgotStepIndicator = () => (
    <div className="auth__steps">
      <div className={`auth__step ${forgotStep >= 1 ? "active" : ""} ${forgotStep > 1 ? "completed" : ""}`}>
        <div className="auth__step-number">{forgotStep > 1 ? "✓" : "1"}</div>
        <span>Số điện thoại</span>
      </div>
      <div className={`auth__step-line ${forgotStep > 1 ? "active" : ""}`}></div>
      <div className={`auth__step ${forgotStep >= 2 ? "active" : ""} ${forgotStep > 2 ? "completed" : ""}`}>
        <div className="auth__step-number">{forgotStep > 2 ? "✓" : "2"}</div>
        <span>Xác thực OTP</span>
      </div>
      <div className={`auth__step-line ${forgotStep > 2 ? "active" : ""}`}></div>
      <div className={`auth__step ${forgotStep >= 3 ? "active" : ""}`}>
        <div className="auth__step-number">3</div>
        <span>Mật khẩu mới</span>
      </div>
    </div>
  );

  // Render forgot step 1: Phone input
  const renderForgotPhoneStep = () => (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={() => handleModeSwitch("login")}>
        ← Quay lại đăng nhập
      </button>
      <div className="auth__welcome">
        <h2>Quên mật khẩu?</h2>
        <p>Nhập số điện thoại để nhận mã OTP đặt lại mật khẩu</p>
      </div>
      <label>
        Số điện thoại
        <input
          name="phone"
          type="tel"
          placeholder="0912345678"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </label>
      <button
        type="button"
        className="auth__submit"
        onClick={handleForgotSendOtp}
        disabled={loading || !formData.phone}
      >
        {loading ? "Đang gửi..." : "Gửi mã OTP"}
      </button>
    </div>
  );

  // Render forgot step 2: OTP verification
  const renderForgotOtpStep = () => (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={() => { setForgotStep(1); setStatus({ type: "", message: "" }); }}>
        ← Quay lại
      </button>
      <div className="auth__welcome">
        <h2>Xác thực OTP</h2>
        <p>Nhập mã 6 số đã gửi đến <strong>{formData.phone}</strong></p>
      </div>
      <div className="auth__otp-inputs" onPaste={handleOtpPaste}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (otpInputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="auth__otp-input"
            value={formData.otp[index] || ""}
            onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
          />
        ))}
      </div>
      <div className="auth__otp-actions">
        <button
          type="button"
          className="auth__resend-btn"
          onClick={handleForgotResendOtp}
          disabled={countdown > 0 || loading}
        >
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}
        </button>
      </div>
      <button
        type="button"
        className="auth__submit"
        onClick={handleForgotVerifyOtp}
        disabled={loading || formData.otp.length !== 6}
      >
        {loading ? "Đang xác thực..." : "Xác nhận"}
      </button>
    </div>
  );

  // Render forgot step 3: New password
  const renderForgotPasswordStep = () => (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={() => { setForgotStep(2); setStatus({ type: "", message: "" }); }}>
        ← Quay lại
      </button>
      <div className="auth__welcome">
        <h2>Đặt mật khẩu mới</h2>
        <p>Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn</p>
      </div>
      <label>
        Mật khẩu mới
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Xác nhận mật khẩu mới
        <input
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </label>
      <button
        type="button"
        className="auth__submit"
        onClick={handleResetPassword}
        disabled={loading || !formData.password || !formData.confirmPassword}
      >
        {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
      </button>
    </div>
  );

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
            <>
              <div className="auth__welcome">
                <h2>Chào mừng trở lại!</h2>
                <p>Vui lòng nhập thông tin để đăng nhập.</p>
              </div>

              <form onSubmit={handleLogin}>
                <label>
                  Số điện thoại
                  <input
                    name="phone"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Mật khẩu
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </label>

                <div className="auth__options">
                  <label className="auth__remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    Ghi nhớ tôi
                  </label>
                  <button type="button" className="auth__link" onClick={() => handleModeSwitch("forgot")}>
                    Quên mật khẩu?
                  </button>
                </div>

                {showCaptcha && (
                  <div style={{ marginTop: "12px" }}>
                    <ReCAPTCHA
                      ref={captchaRef}
                      sitekey={SITE_KEY}
                      onChange={(token) => setCaptchaToken(token)}
                    />
                  </div>
                )}

                <button type="submit" className="auth__submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>

              <div className="auth__divider">
                <span>Hoặc tiếp tục với</span>
              </div>

              <div className="auth__social">
                <button type="button" aria-label="Google sign in">
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                  />
                </button>
                <button type="button" aria-label="Facebook sign in">
                  <img
                    src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg"
                    alt="Facebook"
                  />
                </button>
              </div>
            </>
          ) : mode === "forgot" ? (
            <>
              {renderForgotStepIndicator()}
              {forgotStep === 1 && renderForgotPhoneStep()}
              {forgotStep === 2 && renderForgotOtpStep()}
              {forgotStep === 3 && renderForgotPasswordStep()}
            </>
          ) : (
            <>
              {renderStepIndicator()}
              {registerStep === 1 && renderPhoneStep()}
              {registerStep === 2 && renderOtpStep()}
              {registerStep === 3 && renderInfoStep()}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
