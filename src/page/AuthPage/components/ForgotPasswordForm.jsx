import InputField from "./InputField";
import OtpForm from "./OtpForm";

function ForgotStepIndicator({ forgotStep }) {
  return (
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
}

function ForgotPhoneStep({ formData, fieldError, loading, onChange, onSendOtp, onBackToLogin }) {
  return (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={onBackToLogin}>
        ← Quay lại đăng nhập
      </button>

      <div className="auth__welcome">
        <h2>Quên mật khẩu?</h2>
        <p>Nhập số điện thoại để nhận mã OTP đặt lại mật khẩu</p>
      </div>

      <InputField
        label="Số điện thoại"
        name="phone"
        type="tel"
        value={formData.phone}
        placeholder="0912345678"
        required
        onChange={onChange}
        className={fieldError.phone ? "auth__input-error" : ""}
        error={fieldError.phone}
      />

      <button type="button" className="auth__submit" onClick={onSendOtp} disabled={loading || !formData.phone}>
        {loading ? "Đang gửi..." : "Gửi mã OTP"}
      </button>
    </div>
  );
}

function ForgotResetStep({ formData, fieldError, loading, onChange, onResetPassword, onBackStep }) {
  return (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={onBackStep}>
        ← Quay lại
      </button>

      <div className="auth__welcome">
        <h2>Đặt mật khẩu mới</h2>
        <p>Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn</p>
      </div>

      <InputField
        label="Mật khẩu mới"
        name="password"
        type="password"
        value={formData.password}
        placeholder="••••••••"
        required
        onChange={onChange}
        className={fieldError.password ? "auth__input-error" : ""}
        error={fieldError.password}
      />

      <InputField
        label="Xác nhận mật khẩu mới"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        placeholder="••••••••"
        required
        onChange={onChange}
        className={fieldError.confirmPassword ? "auth__input-error" : ""}
        error={fieldError.confirmPassword}
      />

      <button
        type="button"
        className="auth__submit"
        onClick={onResetPassword}
        disabled={loading || !formData.password || !formData.confirmPassword}
      >
        {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
      </button>
    </div>
  );
}

export default function ForgotPasswordForm({
  forgotStep,
  formData,
  fieldError,
  loading,
  countdown,
  onChange,
  onBackToLogin,
  onBackStep,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
  onResendOtp,
  onResetPassword,
}) {
  return (
    <>
      <ForgotStepIndicator forgotStep={forgotStep} />

      {forgotStep === 1 && (
        <ForgotPhoneStep
          formData={formData}
          fieldError={fieldError}
          loading={loading}
          onChange={onChange}
          onSendOtp={onSendOtp}
          onBackToLogin={onBackToLogin}
        />
      )}

      {forgotStep === 2 && (
        <OtpForm
          title="Xác thực OTP"
          description="Nhập mã 6 số đã gửi đến"
          phone={formData.phone}
          otpValue={formData.otp}
          otpError={fieldError.otp}
          loading={loading}
          countdown={countdown}
          onBack={onBackStep}
          onOtpChange={onOtpChange}
          onResend={onResendOtp}
          onSubmit={onVerifyOtp}
          disableSubmit={formData.otp.length !== 6}
        />
      )}

      {forgotStep === 3 && (
        <ForgotResetStep
          formData={formData}
          fieldError={fieldError}
          loading={loading}
          onChange={onChange}
          onResetPassword={onResetPassword}
          onBackStep={onBackStep}
        />
      )}
    </>
  );
}
