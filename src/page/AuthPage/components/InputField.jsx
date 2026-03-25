export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className = "",
  inputProps = {},
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...inputProps}
      />
      {error ? <span className="auth__field-error">{error}</span> : null}
    </label>
  );
}
