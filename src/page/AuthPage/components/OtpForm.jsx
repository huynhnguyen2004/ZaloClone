import { useRef } from "react";

export default function OtpForm({
  title,
  description,
  phone,
  otpValue,
  otpError,
  loading,
  countdown,
  onBack,
  backLabel = "← Quay lại",
  onOtpChange,
  onResend,
  onSubmit,
  submitLabel = "Xác nhận",
  disableSubmit = false,
}) {
  const otpInputsRef = useRef([]);

  const otpChars = Array.from({ length: 6 }, (_, index) => otpValue[index] || "");

  const updateOtp = (nextOtp) => {
    onOtpChange(nextOtp.replace(/\D/g, "").slice(0, 6));
  };

  const handleOtpChange = (index, value) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otpChars];
    nextOtp[index] = nextValue;
    updateOtp(nextOtp.join(""));

    if (nextValue && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpChars[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    updateOtp(pastedData);
    const focusIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="auth__step-content fade-in">
      <button type="button" className="auth__back-btn" onClick={onBack}>
        {backLabel}
      </button>

      <div className="auth__welcome">
        <h2>{title}</h2>
        <p>
          {description} <strong>{phone}</strong>
        </p>
      </div>

      <div className="auth__otp-inputs" onPaste={handleOtpPaste}>
        {otpChars.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              otpInputsRef.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={`auth__otp-input ${otpError ? "auth__input-error" : ""}`}
            value={digit}
            onChange={(event) => handleOtpChange(index, event.target.value)}
            onKeyDown={(event) => handleOtpKeyDown(index, event)}
          />
        ))}
      </div>
      {otpError ? <span className="auth__field-error">{otpError}</span> : null}

      <div className="auth__otp-actions">
        <button
          type="button"
          className="auth__resend-btn"
          onClick={onResend}
          disabled={countdown > 0 || loading}
        >
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}
        </button>
      </div>

      <button type="button" className="auth__submit" onClick={onSubmit} disabled={loading || disableSubmit}>
        {loading ? "Đang xác thực..." : submitLabel}
      </button>
    </div>
  );
}
