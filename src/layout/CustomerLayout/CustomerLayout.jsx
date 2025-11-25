import { Outlet } from "react-router-dom";

export default function CustomerLayout() {
  return (
    <div>
      <h1>Customer Layout</h1>
      <Outlet />
    </div>
  );
}
