import { type ComponentType } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";

export function ProtectedRoute({ component: Component }: { component: ComponentType<any> }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}
