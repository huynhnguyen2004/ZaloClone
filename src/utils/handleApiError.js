import { errorMessage } from "./errorMapper";
export const handleApiError = (error, setStatus, setFieldError) => {
  const res = error?.response?.data;
  if (!res) {
    setStatus({ type: "error", message: "Lỗi Server" });
    return;
  }
  if (res?.code === "VALIDATION_ERROR") {
    const error = res?.result;
    const mappedError = {};
    Object.keys(error).forEach((field) => {
      const errorCode = error[field];

      const normalizedField = field.toLowerCase();

      mappedError[normalizedField] =
        errorMessage[errorCode] || errorMessage.UNKNOWN_ERROR;
    });
    setFieldError(mappedError);
    setStatus({ type: "", message: "" });
    return;
  }
  const message =
    errorMessage[res.code] || res.message || errorMessage.UNKNOWN_ERROR;
  setStatus({ type: "error", message });
};
