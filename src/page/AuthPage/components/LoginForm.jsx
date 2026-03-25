import ReCAPTCHA from "react-google-recaptcha";
import InputField from "./InputField";

export default function LoginForm({
  formData,
  fieldError,
  loading,
  showCaptcha,
  captchaRef,
  siteKey,
  onChange,
  onCaptchaChange,
  onSubmit,
  onForgotPassword,
}) {
  return (
    <>
      <div className="auth__welcome">
        <h2>Chào mừng trở lại!</h2>
        <p>Vui lòng nhập thông tin để đăng nhập.</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <InputField
          label="Số điện thoại"
          name="phone"
          value={formData.phone}
          placeholder="0912345678"
          required
          onChange={onChange}
          className={fieldError.phone ? "auth__input-error" : ""}
          error={fieldError.phone}
        />

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

        <div className="auth__options">
          <label className="auth__remember">
            <input
              type="checkbox"
              name="isRememberMe"
              checked={formData.isRememberMe}
              onChange={onChange}
              
            />
            Ghi nhớ tôi
          </label>
          <button
            type="button"
            className="auth__link"
            onClick={onForgotPassword}
          >
            Quên mật khẩu?
          </button>
        </div>

        {showCaptcha && (
          <div style={{ marginTop: "12px" }}>
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={siteKey}
              onChange={onCaptchaChange}
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
  );
}
