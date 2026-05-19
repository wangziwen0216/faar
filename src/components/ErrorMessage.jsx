export default function ErrorMessage({ message = '加载失败，请稍后重试' }) {
  return <div className="error-message">{message}</div>
}
