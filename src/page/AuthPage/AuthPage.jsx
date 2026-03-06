import { useEffect, useRef, useState } from "react";
import { login, register } from "../../api/service/authService";
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
};
const SITE_KEY = "6LchvTUsAAAAAHygJx9houBHwGhQvHAtOf_yWUa3";
function AuthPage() {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState(initialFormState);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [failed, setFailed] = useState(0);
  const [loading, setLoading] = useState(false);
  const captchaRef = useRef(null);

  const navigate = useNavigate();
  const { fetchCurrentUser } = useUser();
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!status?.message) return;

    const timer = setTimeout(() => {
      setStatus({ type: "", message: "" });
    }, 2000);

    return () => clearTimeout(timer);
  }, [status]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      setStatus({ type: "error", message: "Mật khẩu xác nhận không khớp" });
      return;
    }

    // Kiểm tra captcha khi đăng nhập thất bại >= 3 lần
    if (mode === "login" && failed >= 3 && !captchaToken) {
      setStatus({ type: "error", message: "Vui lòng xác minh captcha" });
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        const { data } = await login({
          phone: formData.phone,
          password: formData.password,
          captchaToken: failed >= 3 ? captchaToken : null,
        });

        const token = data?.result?.accessToken;
        if (token) {
          setFailed(0);
          setCaptchaToken(null);

          sessionStorage.setItem("token", token);
        }
        if (token) {
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
      } else {
        await register({
          phone: formData.phone,
          password: formData.password,
          firstname: formData.firstname,
          lastname: formData.lastname,
          birthday: formData.birthday,
          gender: parseInt(formData.gender),
        });
        setStatus({
          type: "success",
          message: "Tạo tài khoản thành công, hãy đăng nhập.",
        });
        setMode("login");
      }
      setFormData(initialFormState);
    } catch (error) {
      const apiMessage =
        error.response?.data?.messenge || "Có lỗi xảy ra, vui lòng thử lại.";
      setStatus({ type: "error", message: apiMessage });

      if (mode === "login") {
        setFailed((prev) => prev + 1);
      }
      if (captchaRef.current) {
        captchaRef.current.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => setMode("login")}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
              type="button"
            >
              Đăng ký
            </button>
          </div>

          <div className="auth__welcome">
            <h2>{mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản"}</h2>
            <p>
              {mode === "login"
                ? "Vui lòng nhập thông tin để đăng nhập."
                : "Điền thông tin bên dưới để bắt đầu cùng chúng tôi."}
            </p>
          </div>

          {status?.message && (
            <div className={`auth__alert ${status.type}`}>{status.message}</div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
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
            )}

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

            {mode === "register" && (
              <>
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
              </>
            )}

            {mode === "login" && (
              <div className="auth__options">
                <label className="auth__remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Ghi nhớ tôi
                </label>
                <button type="button" className="auth__link">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {mode === "login" && failed >= 3 && (
              <div style={{ marginTop: "12px" }}>
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                />
              </div>
            )}
            <button type="submit" className="auth__submit" disabled={loading}>
              {loading
                ? "Đang xử lý..."
                : mode === "login"
                ? "Đăng nhập"
                : "Đăng ký"}
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
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
