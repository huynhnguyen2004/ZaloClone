import InputField from "./InputField";
import OtpForm from "./OtpForm";

function RegisterStepIndicator({ registerStep }) {
  return (
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
}

function RegisterPhoneStep({ formData, fieldError, loading, onChange, onSendOtp }) {
  return (
    <div className="auth__step-content fade-in">
      <div className="auth__welcome">
        <h2>Nhập số điện thoại</h2>
        <p>Chúng tôi sẽ gửi mã OTP để xác thực số điện thoại của bạn</p>
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

function RegisterInfoStep({ formData, fieldError, loading, onChange, onBack, onRegister }) {
  return (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={onBack}>
        ← Quay lại
      </button>

      <div className="auth__welcome">
        <h2>Hoàn tất đăng ký</h2>
        <p>Điền thông tin cá nhân để tạo tài khoản</p>
      </div>

      <div className="auth__name-fields">
        <InputField
          label="Tên"
          name="firstname"
          value={formData.firstname}
          placeholder="Nguyễn"
          required
          onChange={onChange}
          className={fieldError.firstname ? "auth__input-error" : ""}
          error={fieldError.firstname}
        />

        <InputField
          label="Họ"
          name="lastname"
          value={formData.lastname}
          placeholder="Văn A"
          required
          onChange={onChange}
          className={fieldError.lastname ? "auth__input-error" : ""}
          error={fieldError.lastname}
        />
      </div>

      <InputField
        label="Mật khẩu"
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
        label="Xác nhận mật khẩu"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        placeholder="••••••••"
        required
        onChange={onChange}
        className={fieldError.confirmPassword ? "auth__input-error" : ""}
        error={fieldError.confirmPassword}
      />

      <InputField
        label="Ngày sinh"
        name="birthday"
        type="date"
        value={formData.birthday}
        required
        onChange={onChange}
        className={fieldError.birthday ? "auth__input-error" : ""}
        error={fieldError.birthday}
      />

      <div className="auth__gender">
        <span>Giới tính</span>
        <div className="auth__gender-options">
          <label>
            <input type="radio" name="gender" value={0} checked={parseInt(formData.gender, 10) === 0} onChange={onChange} />
            Nam
          </label>
          <label>
            <input type="radio" name="gender" value={1} checked={parseInt(formData.gender, 10) === 1} onChange={onChange} />
            Nữ
          </label>
          <label>
            <input type="radio" name="gender" value={2} checked={parseInt(formData.gender, 10) === 2} onChange={onChange} />
            Khác
          </label>
        </div>
        {fieldError.gender ? <span className="auth__field-error">{fieldError.gender}</span> : null}
      </div>

      <button type="button" className="auth__submit" onClick={onRegister} disabled={loading}>
        {loading ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
      </button>
    </div>
  );
}

export default function RegisterForm({
  registerStep,
  formData,
  fieldError,
  loading,
  countdown,
  onChange,
  onBack,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
  onResendOtp,
  onRegister,
}) {
  return (
    <>
      <RegisterStepIndicator registerStep={registerStep} />

      {registerStep === 1 && (
        <RegisterPhoneStep
          formData={formData}
          fieldError={fieldError}
          loading={loading}
          onChange={onChange}
          onSendOtp={onSendOtp}
        />
      )}

      {registerStep === 2 && (
        <OtpForm
          title="Xác thực OTP"
          description="Nhập mã 6 số đã gửi đến"
          phone={formData.phone}
          otpValue={formData.otp}
          otpError={fieldError.otp}
          loading={loading}
          countdown={countdown}
          onBack={onBack}
          onOtpChange={onOtpChange}
          onResend={onResendOtp}
          onSubmit={onVerifyOtp}
        />
      )}

      {registerStep === 3 && (
        <RegisterInfoStep
          formData={formData}
          fieldError={fieldError}
          loading={loading}
          onChange={onChange}
          onBack={onBack}
          onRegister={onRegister}
        />
      )}
    </>
  );
}
