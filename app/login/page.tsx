// Login-side. Kombinerer login-layout med login-formular.

import LoginLayout from "./loginLayout";
import LoginForm from "./loginForm";

export default function Page() {
  return (
    <LoginLayout>
      <LoginForm />
    </LoginLayout>
  );
}
